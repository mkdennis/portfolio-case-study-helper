// Project types
export interface ProjectMetadata {
  id: string;
  name: string;
  role: string;
  timeframe: {
    start: string;
    end: string | null;
    status: "in-progress" | "completed" | "paused";
  };
  problemSpace: string;
  constraints: {
    team: string;
    timeline: string;
    scope: string;
    technical: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Journal entry types
export interface JournalEntry {
  date: string;
  tags: string[];
  assets: string[];
  content: {
    decision?: string;
    why?: string;
    milestone?: string;
    change?: string;
    tradeoff?: string;
    feedback?: string;
  };
  rawMarkdown: string;
}

export interface JournalEntryFrontmatter {
  date: string;
  tags: string[];
  assets: string[];
}

// Asset types
export interface AssetMetadata {
  filename: string;
  uploadedAt: string;
  role: "before" | "after" | "before-after" | "exploration" | "final" | "process" | "other";
  suggestedName: string;
  linkedEntries: string[];
  linkedSections: string[];
  altText: string;
  tags: string[];
  fileSize: number;
  dimensions?: string;
}

// App configuration
export interface AppConfig {
  version: string;
  user: {
    githubUsername: string;
    preferences: {
      defaultTone: "concise" | "balanced" | "detailed";
      journalReminders: boolean;
      autoSuggestAssetNames: boolean;
    };
  };
  app: {
    repoName: string;
    createdAt: string;
  };
}

// GitHub file types
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  content?: string;
  download_url?: string;
}

// Session types (extending NextAuth)
export interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  accessToken: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Journal prompts
export const JOURNAL_PROMPTS = [
  { key: "decision", label: "What decision did you make today?", placeholder: "Describe a key design decision you made..." },
  { key: "why", label: "Why did you make this decision?", placeholder: "Explain the reasoning behind your decision..." },
  { key: "milestone", label: "What milestone did you hit or move closer to?", placeholder: "Share progress on your project goals..." },
  { key: "change", label: "What changed from the previous iteration?", placeholder: "Describe what's different from before..." },
  { key: "tradeoff", label: "What tradeoff or tension came up?", placeholder: "What compromises did you navigate..." },
  { key: "feedback", label: "What feedback influenced today's work?", placeholder: "Share feedback that shaped your decisions..." },
] as const;

export type JournalPromptKey = typeof JOURNAL_PROMPTS[number]["key"];

// Tag types
export const ENTRY_TAGS = ["decision", "milestone", "iteration", "feedback", "insight", "blocker"] as const;
export type EntryTag = typeof ENTRY_TAGS[number];

// Asset role types
export const ASSET_ROLES = ["before", "after", "before-after", "exploration", "final", "process", "other"] as const;
export type AssetRole = typeof ASSET_ROLES[number];

// Timeline types
export interface TimelineJournalItem {
  type: "journal";
  date: string;
  data: JournalEntry;
}

export interface TimelineAssetItem {
  type: "asset";
  date: string;
  data: AssetMetadata & { url: string };
}

export type TimelineItem = TimelineJournalItem | TimelineAssetItem;
