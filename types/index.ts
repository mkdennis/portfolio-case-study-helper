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
  section?: CaseStudySection;
  content: {
    text?: string;
    // Legacy fields for backward compatibility with existing entries
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
  section?: CaseStudySection;
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


// Tag types
export const ENTRY_TAGS = ["decision", "milestone", "iteration", "feedback", "insight", "blocker"] as const;
export type EntryTag = typeof ENTRY_TAGS[number];

// Asset role types
export const ASSET_ROLES = ["before", "after", "before-after", "exploration", "final", "process", "other"] as const;
export type AssetRole = typeof ASSET_ROLES[number];

// Case study section types
export const CASE_STUDY_SECTIONS = ["process", "iterations", "research", "final-results"] as const;
export type CaseStudySection = typeof CASE_STUDY_SECTIONS[number];

export const CASE_STUDY_SECTION_LABELS: Record<CaseStudySection, string> = {
  "process": "Process",
  "iterations": "Iterations",
  "research": "Research",
  "final-results": "Final Results"
};

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

// Case study compiler types
export interface CaseStudyState {
  selectedIds: Set<string>;
  orderedIds: string[];
  itemsMap: Map<string, TimelineItem>;
}
