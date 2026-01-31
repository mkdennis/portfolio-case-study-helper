import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  getFileContent,
  createOrUpdateFile,
} from "@/lib/github";

// GET /api/write-up - Get the write-up content for a project
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

    const content = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${project}/write-up.md`
    );

    return NextResponse.json({
      content: content?.content || "",
    });
  } catch (error) {
    console.error("Error fetching write-up:", error);
    return NextResponse.json(
      { error: "Failed to fetch write-up" },
      { status: 500 }
    );
  }
}

// POST /api/write-up - Save the write-up content for a project
export async function POST(request: NextRequest) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    const body = await request.json();
    const { projectSlug, content } = body;

    if (!projectSlug) {
      return NextResponse.json(
        { error: "Project slug is required" },
        { status: 400 }
      );
    }

    // Get existing file to check for SHA (for updates)
    const existing = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/write-up.md`
    );

    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/write-up.md`,
      content,
      "Update case study write-up",
      existing?.sha
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving write-up:", error);
    return NextResponse.json(
      { error: "Failed to save write-up" },
      { status: 500 }
    );
  }
}
