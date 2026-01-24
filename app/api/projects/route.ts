import { NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  getDirectoryContents,
  getFileContent,
  createProjectStructure,
} from "@/lib/github";
import { isLocalMode, getLocalProjects } from "@/lib/local-files";
import type { ProjectMetadata } from "@/types";

// GET /api/projects - List all projects
export async function GET() {
  try {
    // Use local files in development mode
    if (isLocalMode()) {
      const projects = getLocalProjects();
      projects.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return NextResponse.json({ projects });
    }

    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    // Get list of projects from projects/ directory
    const projectDirs = await getDirectoryContents(
      octokit,
      owner,
      repo,
      "projects"
    );

    const projects: ProjectMetadata[] = [];

    for (const dir of projectDirs) {
      if (dir.type === "dir" && dir.name !== ".gitkeep") {
        const metaContent = await getFileContent(
          octokit,
          owner,
          repo,
          `projects/${dir.name}/meta.json`
        );

        if (metaContent) {
          try {
            const metadata = JSON.parse(metaContent.content) as ProjectMetadata;
            projects.push(metadata);
          } catch (e) {
            console.error(`Error parsing meta.json for ${dir.name}:`, e);
          }
        }
      }
    }

    // Sort by updatedAt descending
    projects.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();
    const projectData = await request.json();

    // Generate slug from name
    const slug = projectData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const now = new Date().toISOString();

    const metadata: ProjectMetadata = {
      id: slug,
      name: projectData.name,
      role: projectData.role,
      timeframe: {
        start: projectData.startDate,
        end: projectData.endDate || null,
        status: projectData.status || "in-progress",
      },
      problemSpace: projectData.problemSpace,
      constraints: {
        team: projectData.team || "",
        timeline: projectData.timeline || "",
        scope: projectData.scope || "",
        technical: projectData.technical || "",
      },
      tags: projectData.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    // Create project structure in GitHub
    await createProjectStructure(octokit, owner, repo, slug, metadata);

    return NextResponse.json({ project: metadata });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
