"use client";

import { db, storeAssetBlob } from "./db";
import { getSyncQueue } from "./sync-queue";
import type { CachedJournalEntry, CachedAsset, CreateJournalPayload } from "./types";
import type { JournalEntry } from "@/types";

interface MutationResult {
  success: boolean;
  isQueued: boolean;
  id?: string;
  error?: string;
}

// Create a journal entry with offline support
export async function createJournalOffline(
  projectSlug: string,
  entry: {
    date: string;
    text: string;
    tags: string[];
    section?: string;
  },
  imageFile?: File
): Promise<MutationResult> {
  const syncQueue = getSyncQueue();
  const operationIds: string[] = [];

  try {
    let assetFilename: string | undefined;

    // If there's an image, queue asset upload first
    if (imageFile) {
      const timestamp = Date.now();
      const safeName = imageFile.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      assetFilename = `${timestamp}-${safeName}`;

      // Store blob locally for offline access
      await storeAssetBlob(assetFilename, projectSlug, imageFile, imageFile.type);

      // Queue asset upload
      const assetOpId = await syncQueue.enqueue({
        type: "asset",
        action: "create",
        entityId: assetFilename,
        projectId: projectSlug,
        payload: {
          projectSlug,
          filename: assetFilename,
          // Note: actual file will be uploaded when online
          // For now, we store metadata
        },
        dependencies: [],
      });
      operationIds.push(assetOpId);

      // Store asset metadata locally
      const assetMeta: CachedAsset = {
        filename: assetFilename,
        uploadedAt: new Date().toISOString(),
        role: "other",
        suggestedName: imageFile.name,
        linkedEntries: [entry.date],
        linkedSections: entry.section ? [entry.section] : [],
        altText: "",
        tags: [],
        fileSize: imageFile.size,
        _projectId: projectSlug,
        url: URL.createObjectURL(imageFile), // Temporary local URL
      };
      await db.assets.add(assetMeta);
    }

    // Queue journal entry creation
    const journalPayload: CreateJournalPayload = {
      projectSlug,
      date: entry.date,
      text: entry.text,
      tags: entry.tags,
      section: entry.section,
      assets: assetFilename ? [assetFilename] : [],
    };

    const journalOpId = await syncQueue.enqueue({
      type: "journal",
      action: "create",
      entityId: entry.date,
      projectId: projectSlug,
      payload: journalPayload,
      dependencies: operationIds, // Depends on asset upload
    });

    // Store journal entry locally (optimistic update)
    const localEntry: CachedJournalEntry = {
      date: entry.date,
      tags: entry.tags,
      assets: assetFilename ? [assetFilename] : [],
      section: entry.section as JournalEntry["section"],
      content: { text: entry.text },
      rawMarkdown: entry.text,
      _projectId: projectSlug,
    };
    await db.journalEntries.add(localEntry);

    // Try to sync immediately if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await syncQueue.processQueue();
      return { success: true, isQueued: false, id: journalOpId };
    }

    return { success: true, isQueued: true, id: journalOpId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, isQueued: false, error: errorMessage };
  }
}

// Create a project with offline support
export async function createProjectOffline(project: {
  name: string;
  role: string;
  startDate: string;
  endDate?: string;
  status?: string;
  problemSpace: string;
  team?: string;
  timeline?: string;
  scope?: string;
  technical?: string;
  tags?: string[];
}): Promise<MutationResult> {
  const syncQueue = getSyncQueue();

  try {
    // Generate slug
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Queue project creation
    const opId = await syncQueue.enqueue({
      type: "project",
      action: "create",
      entityId: slug,
      projectId: slug,
      payload: project,
      dependencies: [],
    });

    // Store project locally (optimistic update)
    const now = new Date().toISOString();
    await db.projects.add({
      id: slug,
      name: project.name,
      role: project.role,
      timeframe: {
        start: project.startDate,
        end: project.endDate || null,
        status: (project.status as "in-progress" | "completed" | "paused") || "in-progress",
      },
      problemSpace: project.problemSpace,
      constraints: {
        team: project.team || "",
        timeline: project.timeline || "",
        scope: project.scope || "",
        technical: project.technical || "",
      },
      tags: project.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Try to sync immediately if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await syncQueue.processQueue();
      return { success: true, isQueued: false, id: opId };
    }

    return { success: true, isQueued: true, id: opId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, isQueued: false, error: errorMessage };
  }
}

// Upload an asset with offline support
export async function uploadAssetOffline(
  projectSlug: string,
  file: File,
  metadata: {
    role?: string;
    altText?: string;
  } = {}
): Promise<MutationResult> {
  const syncQueue = getSyncQueue();

  try {
    const timestamp = Date.now();
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
    const filename = `${timestamp}-${safeName}`;

    // Store blob locally
    await storeAssetBlob(filename, projectSlug, file, file.type);

    // Queue asset upload
    const opId = await syncQueue.enqueue({
      type: "asset",
      action: "create",
      entityId: filename,
      projectId: projectSlug,
      payload: {
        projectSlug,
        filename,
        role: metadata.role || "other",
        altText: metadata.altText || "",
      },
      dependencies: [],
    });

    // Store asset metadata locally
    const assetMeta: CachedAsset = {
      filename,
      uploadedAt: new Date().toISOString(),
      role: (metadata.role as CachedAsset["role"]) || "other",
      suggestedName: file.name,
      linkedEntries: [],
      linkedSections: [],
      altText: metadata.altText || "",
      tags: [],
      fileSize: file.size,
      _projectId: projectSlug,
      url: URL.createObjectURL(file),
    };
    await db.assets.add(assetMeta);

    // Try to sync immediately if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await syncQueue.processQueue();
      return { success: true, isQueued: false, id: opId };
    }

    return { success: true, isQueued: true, id: opId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, isQueued: false, error: errorMessage };
  }
}
