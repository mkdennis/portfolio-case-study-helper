import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";

const PROJECTS_DIR = path.join(process.cwd(), "projects");

export function isLocalMode(): boolean {
  return process.env.USE_LOCAL_FILES === "true";
}

export function getLocalProject(slug: string): {
  project: ProjectMetadata;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
  stats: { entriesCount: number; assetsCount: number; lastUpdated: string };
} | null {
  const projectDir = path.join(PROJECTS_DIR, slug);

  // Check if project exists
  if (!fs.existsSync(projectDir)) {
    return null;
  }

  // Read meta.json
  const metaPath = path.join(projectDir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  const metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ProjectMetadata;

  // Read journal entries
  const journalDir = path.join(projectDir, "journal");
  const entries: JournalEntry[] = [];

  if (fs.existsSync(journalDir)) {
    const files = fs.readdirSync(journalDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const content = fs.readFileSync(path.join(journalDir, file), "utf-8");
      try {
        const parsed = matter(content);
        const extractedContent: JournalEntry["content"] = {
          decision: extractSection(parsed.content, "decision"),
          why: extractSection(parsed.content, "why"),
          milestone: extractSection(parsed.content, "milestone"),
          change: extractSection(parsed.content, "change"),
          tradeoff: extractSection(parsed.content, "tradeoff"),
          feedback: extractSection(parsed.content, "feedback"),
        };

        // Check for other headings and combine as text
        const hasLegacyContent = Object.values(extractedContent).some(Boolean);
        if (!hasLegacyContent && parsed.content.trim()) {
          extractedContent.text = parsed.content.trim();
        }

        const entry: JournalEntry = {
          date: parsed.data.date || file.replace(".md", ""),
          tags: parsed.data.tags || [],
          assets: parsed.data.assets || [],
          section: parsed.data.section,
          content: extractedContent,
          rawMarkdown: content,
        };
        entries.push(entry);
      } catch (e) {
        console.error(`Error parsing local journal entry ${file}:`, e);
      }
    }
  }

  // Sort entries by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Read assets
  const assetsDir = path.join(projectDir, "assets");
  const assets: Array<AssetMetadata & { url: string }> = [];

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir).filter(
      (f) => !f.startsWith(".") && f !== ".gitkeep" && !fs.statSync(path.join(assetsDir, f)).isDirectory()
    );

    for (const file of files) {
      const metadataPath = path.join(assetsDir, ".metadata", `${file}.json`);

      const assetData: AssetMetadata & { url: string } = {
        filename: file,
        uploadedAt: new Date().toISOString(),
        role: "other",
        suggestedName: file,
        linkedEntries: [],
        linkedSections: [],
        altText: "",
        tags: [],
        fileSize: 0,
        url: `/projects/${slug}/assets/${file}`,
      };

      if (fs.existsSync(metadataPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8")) as AssetMetadata;
          Object.assign(assetData, meta);
        } catch (e) {
          console.error(`Error parsing asset metadata for ${file}:`, e);
        }
      }

      assets.push(assetData);
    }
  }

  return {
    project: metadata,
    entries,
    assets,
    stats: {
      entriesCount: entries.length,
      assetsCount: assets.length,
      lastUpdated: metadata.updatedAt,
    },
  };
}

export function getLocalProjects(): ProjectMetadata[] {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects: ProjectMetadata[] = [];
  const dirs = fs.readdirSync(PROJECTS_DIR);

  for (const dir of dirs) {
    const metaPath = path.join(PROJECTS_DIR, dir, "meta.json");
    if (fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ProjectMetadata;
        projects.push(metadata);
      } catch (e) {
        console.error(`Error reading project ${dir}:`, e);
      }
    }
  }

  return projects;
}

function extractSection(content: string, section: string): string | undefined {
  const patterns = [
    new RegExp(`##\\s*(?:What\\s+)?${section}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, "i"),
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
