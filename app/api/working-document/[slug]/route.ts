import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  createOrUpdateFile,
  getFileContent,
} from "@/lib/github";
import { isLocalMode } from "@/lib/local-files";
import fs from "fs";
import path from "path";
import type { WorkingDocument } from "@/types";

const PROJECTS_DIR = path.join(process.cwd(), "projects");

// GET /api/working-document/[slug] - Get working document for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    if (isLocalMode()) {
      const docPath = path.join(PROJECTS_DIR, slug, "working-document.json");

      if (!fs.existsSync(docPath)) {
        return NextResponse.json(
          { error: "Working document not found" },
          { status: 404 }
        );
      }

      const content = fs.readFileSync(docPath, "utf-8");
      const document = JSON.parse(content) as WorkingDocument;

      return NextResponse.json(document);
    }

    // GitHub mode
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    const content = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${slug}/working-document.json`
    );

    if (!content) {
      return NextResponse.json(
        { error: "Working document not found" },
        { status: 404 }
      );
    }

    const document = JSON.parse(content.content) as WorkingDocument;
    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching working document:", error);
    return NextResponse.json(
      { error: "Failed to fetch working document" },
      { status: 500 }
    );
  }
}

// PUT /api/working-document/[slug] - Save working document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const document = (await request.json()) as WorkingDocument;

    // Update timestamp
    document.updatedAt = new Date().toISOString();

    if (isLocalMode()) {
      const projectDir = path.join(PROJECTS_DIR, slug);

      if (!fs.existsSync(projectDir)) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      const docPath = path.join(projectDir, "working-document.json");
      fs.writeFileSync(docPath, JSON.stringify(document, null, 2));

      return NextResponse.json({ success: true });
    }

    // GitHub mode
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    // Check if document already exists
    const existingContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${slug}/working-document.json`
    );

    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `projects/${slug}/working-document.json`,
      JSON.stringify(document, null, 2),
      existingContent
        ? `Update working document`
        : `Create working document`,
      existingContent?.sha
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving working document:", error);
    return NextResponse.json(
      { error: "Failed to save working document" },
      { status: 500 }
    );
  }
}
