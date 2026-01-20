import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  getFileContent,
  createOrUpdateFile,
  getDirectoryContents,
} from "@/lib/github";
import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";
import matter from "gray-matter";

// GET /api/projects/[slug] - Get a single project with entries and assets
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();
    const { slug } = await params;

    // Get project metadata
    const metaContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${slug}/meta.json`
    );

    if (!metaContent) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const metadata = JSON.parse(metaContent.content) as ProjectMetadata;

    // Get journal entries
    const journalFiles = await getDirectoryContents(
      octokit,
      owner,
      repo,
      `projects/${slug}/journal`
    );

    const entries: JournalEntry[] = [];

    for (const file of journalFiles) {
      if (file.type === "file" && file.name.endsWith(".md")) {
        const content = await getFileContent(
          octokit,
          owner,
          repo,
          `projects/${slug}/journal/${file.name}`
        );

        if (content) {
          try {
            const parsed = matter(content.content);
            const entry: JournalEntry = {
              date: parsed.data.date || file.name.replace(".md", ""),
              tags: parsed.data.tags || [],
              assets: parsed.data.assets || [],
              content: {
                decision: extractSection(parsed.content, "decision"),
                why: extractSection(parsed.content, "why"),
                milestone: extractSection(parsed.content, "milestone"),
                change: extractSection(parsed.content, "change"),
                tradeoff: extractSection(parsed.content, "tradeoff"),
                feedback: extractSection(parsed.content, "feedback"),
              },
              rawMarkdown: content.content,
            };
            entries.push(entry);
          } catch (e) {
            console.error(`Error parsing journal entry ${file.name}:`, e);
          }
        }
      }
    }

    // Sort entries by date descending
    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get assets
    const assetFiles = await getDirectoryContents(
      octokit,
      owner,
      repo,
      `projects/${slug}/assets`
    );

    const assets: Array<AssetMetadata & { url: string }> = [];

    for (const file of assetFiles) {
      if (
        file.type === "file" &&
        !file.name.startsWith(".") &&
        file.name !== ".gitkeep"
      ) {
        // Try to get metadata
        const metadataContent = await getFileContent(
          octokit,
          owner,
          repo,
          `projects/${slug}/assets/.metadata/${file.name}.json`
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
          url: `https://raw.githubusercontent.com/${owner}/${repo}/main/projects/${slug}/assets/${file.name}`,
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

    return NextResponse.json({
      project: metadata,
      entries,
      assets,
      stats: {
        entriesCount: entries.length,
        assetsCount: assets.length,
        lastUpdated: metadata.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug] - Update project metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();
    const { slug } = await params;
    const updates = await request.json();

    // Get existing metadata
    const metaContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${slug}/meta.json`
    );

    if (!metaContent) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existingMeta = JSON.parse(metaContent.content) as ProjectMetadata;

    // Merge updates
    const updatedMeta: ProjectMetadata = {
      ...existingMeta,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save updated metadata
    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `projects/${slug}/meta.json`,
      JSON.stringify(updatedMeta, null, 2),
      `Update project: ${updatedMeta.name}`,
      metaContent.sha
    );

    return NextResponse.json({ project: updatedMeta });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// Helper function to extract content after a heading
function extractSection(content: string, section: string): string | undefined {
  const patterns = [
    new RegExp(
      `##\\s*(?:What\\s+)?${section}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`,
      "i"
    ),
    new RegExp(`\\*\\*${section}\\*\\*[:\\s]*([^\\n]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}
