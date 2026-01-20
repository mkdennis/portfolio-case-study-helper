import { z } from "zod";

export const projectMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Project name is required"),
  role: z.string().min(1, "Role is required"),
  timeframe: z.object({
    start: z.string().min(1, "Start date is required"),
    end: z.string().nullable(),
    status: z.enum(["in-progress", "completed", "paused"]),
  }),
  problemSpace: z.string().min(10, "Please describe the problem space (at least 10 characters)"),
  constraints: z.object({
    team: z.string().default(""),
    timeline: z.string().default(""),
    scope: z.string().default(""),
    technical: z.string().default(""),
  }),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  role: z.string().min(1, "Role is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  status: z.enum(["in-progress", "completed", "paused"]).default("in-progress"),
  problemSpace: z.string().min(10, "Please describe the problem space (at least 10 characters)"),
  team: z.string().optional(),
  timeline: z.string().optional(),
  scope: z.string().optional(),
  technical: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const journalEntrySchema = z.object({
  date: z.string(),
  tags: z.array(z.string()).default([]),
  assets: z.array(z.string()).default([]),
  decision: z.string().optional(),
  why: z.string().optional(),
  milestone: z.string().optional(),
  change: z.string().optional(),
  tradeoff: z.string().optional(),
  feedback: z.string().optional(),
});

export const assetMetadataSchema = z.object({
  filename: z.string(),
  uploadedAt: z.string(),
  role: z.enum(["before", "after", "before-after", "exploration", "final", "process", "other"]),
  suggestedName: z.string(),
  linkedEntries: z.array(z.string()).default([]),
  linkedSections: z.array(z.string()).default([]),
  altText: z.string().default(""),
  tags: z.array(z.string()).default([]),
  fileSize: z.number(),
  dimensions: z.string().optional(),
});

export const appConfigSchema = z.object({
  version: z.string(),
  user: z.object({
    githubUsername: z.string(),
    preferences: z.object({
      defaultTone: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
      journalReminders: z.boolean().default(false),
      autoSuggestAssetNames: z.boolean().default(true),
    }),
  }),
  app: z.object({
    repoName: z.string(),
    createdAt: z.string(),
  }),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type JournalEntryInput = z.input<typeof journalEntrySchema>;
export type AssetMetadataInput = z.input<typeof assetMetadataSchema>;
