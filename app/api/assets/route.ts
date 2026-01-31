import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  getDirectoryContents,
  getFileContent,
  uploadBinaryFile,
  createOrUpdateFile,
  deleteFile,
} from "@/lib/github";
import type { AssetMetadata } from "@/types";

// GET /api/assets - List assets for a project
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get("project");

  if (!project) {
    return NextResponse.json(
      { error: "Project is required" },
      { status: 400 }
    );
  }

  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    const assetFiles = await getDirectoryContents(
      octokit,
      owner,
      repo,
      `projects/${project}/assets`
    );

    const assets: Array<AssetMetadata & { url: string }> = [];

    for (const file of assetFiles) {
      if (
        file.type === "file" &&
        !file.name.startsWith(".") &&
        file.name !== ".gitkeep"
      ) {
        const metadataContent = await getFileContent(
          octokit,
          owner,
          repo,
          `projects/${project}/assets/.metadata/${file.name}.json`
        );

        const assetData: AssetMetadata & { url: string } = {
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          role: "other",
          suggestedName: file.name,
          linkedEntries: [],
          linkedSections: [],
          altText: "",
          tags: [],
          fileSize: 0,
          url: `https://raw.githubusercontent.com/${owner}/${repo}/main/projects/${project}/assets/${file.name}`,
        };

        if (metadataContent) {
          try {
            const meta = JSON.parse(metadataContent.content) as AssetMetadata;
            Object.assign(assetData, meta);
          } catch (e) {
            console.error(`Error parsing asset metadata for ${file.name}:`, e);
          }
        }

        assets.push(assetData);
      }
    }

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

// POST /api/assets - Upload a new asset
export async function POST(request: NextRequest) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectSlug = formData.get("projectSlug") as string;
    const role = (formData.get("role") as string) || "other";
    const altText = (formData.get("altText") as string) || "";

    if (!file || !projectSlug) {
      return NextResponse.json(
        { error: "File and projectSlug are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPG, GIF, PDF" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Generate safe filename
    const timestamp = Date.now();
    const safeFilename = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const filename = `${timestamp}-${safeFilename}`;

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    await uploadBinaryFile(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/assets/${filename}`,
      arrayBuffer,
      `Add asset: ${filename}`
    );

    // Create metadata
    const metadata: AssetMetadata = {
      filename,
      uploadedAt: new Date().toISOString(),
      role: role as AssetMetadata["role"],
      suggestedName: file.name.replace(/\.[^/.]+$/, ""),
      linkedEntries: [],
      linkedSections: [],
      altText,
      tags: [],
      fileSize: file.size,
    };

    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/assets/.metadata/${filename}.json`,
      JSON.stringify(metadata, null, 2),
      `Add asset metadata: ${filename}`
    );

    // Update project timestamp
    const metaContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/meta.json`
    );

    if (metaContent) {
      const projectMeta = JSON.parse(metaContent.content);
      projectMeta.updatedAt = new Date().toISOString();

      await createOrUpdateFile(
        octokit,
        owner,
        repo,
        `projects/${projectSlug}/meta.json`,
        JSON.stringify(projectMeta, null, 2),
        "Update project timestamp",
        metaContent.sha
      );
    }

    return NextResponse.json({
      success: true,
      asset: {
        ...metadata,
        url: `https://raw.githubusercontent.com/${owner}/${repo}/main/projects/${projectSlug}/assets/${filename}`,
      },
    });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}

// DELETE /api/assets - Delete an asset
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get("project");
  const filename = searchParams.get("filename");

  if (!project || !filename) {
    return NextResponse.json(
      { error: "Project and filename are required" },
      { status: 400 }
    );
  }

  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    // Get the asset file to get its SHA
    const assetFiles = await getDirectoryContents(
      octokit,
      owner,
      repo,
      `projects/${project}/assets`
    );

    const assetFile = assetFiles.find((f) => f.name === filename);
    if (!assetFile) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete the asset file
    await deleteFile(
      octokit,
      owner,
      repo,
      `projects/${project}/assets/${filename}`,
      assetFile.sha,
      `Delete asset: ${filename}`
    );

    // Try to delete metadata file if it exists
    const metadataContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${project}/assets/.metadata/${filename}.json`
    );

    if (metadataContent) {
      await deleteFile(
        octokit,
        owner,
        repo,
        `projects/${project}/assets/.metadata/${filename}.json`,
        metadataContent.sha,
        `Delete asset metadata: ${filename}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
