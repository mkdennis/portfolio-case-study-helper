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
export const CASE_STUDY_SECTIONS = ["all", "process", "iterations", "research", "final-results"] as const;
export type CaseStudySection = typeof CASE_STUDY_SECTIONS[number];

// Sections that can be marked as complete (excludes "all")
export const TRACKABLE_SECTIONS = CASE_STUDY_SECTIONS.filter((s): s is Exclude<CaseStudySection, "all"> => s !== "all");

export const CASE_STUDY_SECTION_LABELS: Record<CaseStudySection, string> = {
  "all": "All Notes",
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

// Working case study document types
export const WORKING_DOCUMENT_SECTIONS = [
  "overview",
  "problem",
  "research",
  "process",
  "iterations",
  "results",
  "reflection",
] as const;
export type WorkingDocumentSection = typeof WORKING_DOCUMENT_SECTIONS[number];

export const WORKING_DOCUMENT_SECTION_LABELS: Record<WorkingDocumentSection, string> = {
  overview: "Overview",
  problem: "Problem Statement",
  research: "Research & Discovery",
  process: "Design Process",
  iterations: "Iterations & Refinement",
  results: "Results & Impact",
  reflection: "Reflection",
};

export const WORKING_DOCUMENT_SECTION_PROMPTS: Record<WorkingDocumentSection, string> = {
  overview: "What is this project about? Who is it for?",
  problem: "What problem were you trying to solve? What was the pain point?",
  research: "What did you learn from research? Who did you talk to?",
  process: "How did you approach the design? What methods did you use?",
  iterations: "How did the design evolve? What changed and why?",
  results: "What was the outcome? How did you measure success?",
  reflection: "What did you learn? What would you do differently?",
};

export interface WorkingDocumentSectionData {
  content: string;
  updatedAt: string;
}

export interface WorkingDocument {
  projectId: string;
  sections: Record<WorkingDocumentSection, WorkingDocumentSectionData>;
  wordGoal: number;
  createdAt: string;
  updatedAt: string;
}

// AI writing assistance types
export interface AISuggestion {
  id: string;
  type: "question" | "suggestion" | "reference";
  content: string;
  source?: string;
  accepted?: boolean;
}

export interface AIWritingAssistantState {
  isOpen: boolean;
  section: WorkingDocumentSection | null;
  isLoading: boolean;
  suggestions: AISuggestion[];
  questions: string[];
}
