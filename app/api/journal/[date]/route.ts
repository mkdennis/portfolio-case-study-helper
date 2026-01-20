import { NextRequest, NextResponse } from "next/server";
import { getDefaultOctokit, getGitHubConfig, getFileContent } from "@/lib/github";
import matter from "gray-matter";
import type { JournalEntry } from "@/types";

// GET /api/journal/[date] - Get a single journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
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
    const { date } = await params;

    const content = await getFileContent(
      octokit,
      owner,
      repo,
      `projects/${project}/journal/${date}.md`
    );

    if (!content) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const parsed = matter(content.content);

    const entry: JournalEntry = {
      date: parsed.data.date || date,
      tags: parsed.data.tags || [],
      assets: parsed.data.assets || [],
      content: extractContent(parsed.content),
      rawMarkdown: content.content,
    };

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entry" },
      { status: 500 }
    );
  }
}

function extractContent(markdown: string): JournalEntry["content"] {
  const content: JournalEntry["content"] = {};

  const sections = [
    { pattern: /##\s*(?:What\s+)?decision[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "decision" },
    { pattern: /##\s*(?:Why|Why\s+did)[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "why" },
    { pattern: /##\s*(?:What\s+)?milestone[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "milestone" },
    { pattern: /##\s*(?:What\s+)?chang[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "change" },
    { pattern: /##\s*(?:What\s+)?tradeoff[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "tradeoff" },
    { pattern: /##\s*(?:What\s+)?feedback[^\n]*\n([\s\S]*?)(?=##|$)/i, key: "feedback" },
  ];

  for (const { pattern, key } of sections) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      content[key as keyof typeof content] = match[1].trim();
    }
  }

  return content;
}
