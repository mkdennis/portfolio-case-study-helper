import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultOctokit,
  getGitHubConfig,
  createOrUpdateFile,
  getDirectoryContents,
  getFileContent,
} from "@/lib/github";
import matter from "gray-matter";
import type { JournalEntry } from "@/types";

// GET /api/journal - List journal entries for a project
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

    const journalFiles = await getDirectoryContents(
      octokit,
      owner,
      repo,
      `projects/${project}/journal`
    );

    const entries: JournalEntry[] = [];

    for (const file of journalFiles) {
      if (file.type === "file" && file.name.endsWith(".md")) {
        const content = await getFileContent(
          octokit,
          owner,
          repo,
          `projects/${project}/journal/${file.name}`
        );

        if (content) {
          try {
            const parsed = matter(content.content);
            const entry: JournalEntry = {
              date: parsed.data.date || file.name.replace(".md", ""),
              tags: parsed.data.tags || [],
              assets: parsed.data.assets || [],
              content: extractContent(parsed.content),
              rawMarkdown: content.content,
            };
            entries.push(entry);
          } catch (e) {
            console.error(`Error parsing entry ${file.name}:`, e);
          }
        }
      }
    }

    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    );
  }
}

// POST /api/journal - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const { owner, repo } = getGitHubConfig();
    const octokit = getDefaultOctokit();

    const body = await request.json();
    const {
      projectSlug,
      date,
      tags = [],
      assets = [],
      text,
    } = body;

    if (!projectSlug || !date) {
      return NextResponse.json(
        { error: "projectSlug and date are required" },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Journal entry text is required" },
        { status: 400 }
      );
    }

    // Build markdown content
    const frontmatter = {
      date,
      tags,
      assets,
    };

    const content = text.trim();

    const markdown = matter.stringify(content, frontmatter);

    // Check if entry already exists
    const existingContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/journal/${date}.md`
    );

    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/journal/${date}.md`,
      markdown,
      existingContent
        ? `Update journal entry: ${date}`
        : `Add journal entry: ${date}`,
      existingContent?.sha
    );

    // Update project's updatedAt
    const metaContent = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${projectSlug}/meta.json`
    );

    if (metaContent) {
      const metadata = JSON.parse(metaContent.content);
      metadata.updatedAt = new Date().toISOString();

      await createOrUpdateFile(
        octokit,
        owner,
        repo,
        `projects/${projectSlug}/meta.json`,
        JSON.stringify(metadata, null, 2),
        "Update project timestamp",
        metaContent.sha
      );
    }

    return NextResponse.json({
      success: true,
      date,
    });
  } catch (error) {
    console.error("Error saving journal entry:", error);
    return NextResponse.json(
      { error: "Failed to save journal entry" },
      { status: 500 }
    );
  }
}

function extractContent(markdown: string): JournalEntry["content"] {
  const content: JournalEntry["content"] = {};

  // Check for legacy section headers
  const legacySections = [
    { pattern: /##\s*(?:What\s+)?decision[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "decision" },
    { pattern: /##\s*(?:Why|Why\s+did)[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "why" },
    { pattern: /##\s*(?:What\s+)?milestone[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "milestone" },
    { pattern: /##\s*(?:What\s+)?chang[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "change" },
    { pattern: /##\s*(?:What\s+)?tradeoff[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "tradeoff" },
    { pattern: /##\s*(?:What\s+)?feedback[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "feedback" },
  ];

  let hasLegacyContent = false;
  for (const { pattern, key } of legacySections) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      content[key as keyof typeof content] = match[1].trim();
      hasLegacyContent = true;
    }
  }

  // If no legacy sections found, treat the whole content as text
  if (!hasLegacyContent && markdown.trim()) {
    content.text = markdown.trim();
  }

  return content;
}
