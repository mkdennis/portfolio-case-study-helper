import Dexie, { type EntityTable } from "dexie";
import type {
  CachedProject,
  CachedJournalEntry,
  CachedAsset,
  CachedAssetBlob,
  SyncOperation,
  SyncState,
} from "./types";

class OfflineDatabase extends Dexie {
  projects!: EntityTable<CachedProject, "id">;
  journalEntries!: EntityTable<CachedJournalEntry, "date">;
  assets!: EntityTable<CachedAsset, "filename">;
  assetBlobs!: EntityTable<CachedAssetBlob, "filename">;
  syncQueue!: EntityTable<SyncOperation, "id">;
  syncState!: EntityTable<SyncState, "key">;

  constructor() {
    super("CaseStudyOffline");

    this.version(1).stores({
      // Projects indexed by id, with sync metadata
      projects: "id, name, _syncedAt",

      // Journal entries with compound index for project lookups
      journalEntries: "date, _projectId, [_projectId+date], _syncedAt",

      // Assets with project index
      assets: "filename, _projectId, uploadedAt, _syncedAt",

      // Binary blobs for offline assets
      assetBlobs: "filename, projectId",

      // Sync queue with status and dependency tracking
      syncQueue: "id, type, status, projectId, createdAt, [status+createdAt]",

      // Key-value store for sync metadata
      syncState: "key",
    });
  }
}

// Singleton instance
export const db = new OfflineDatabase();

// Helper functions for common operations
export async function cacheProjects(
  projects: CachedProject[]
): Promise<void> {
  const now = new Date().toISOString();
  const withSyncTime = projects.map((p) => ({
    ...p,
    _syncedAt: now,
  }));
  await db.projects.bulkPut(withSyncTime);
}

export async function cacheJournalEntries(
  projectId: string,
  entries: CachedJournalEntry[]
): Promise<void> {
  const now = new Date().toISOString();
  const withMeta = entries.map((e) => ({
    ...e,
    _projectId: projectId,
    _syncedAt: now,
  }));
  await db.journalEntries.bulkPut(withMeta);
}

export async function cacheAssets(
  projectId: string,
  assets: CachedAsset[]
): Promise<void> {
  const now = new Date().toISOString();
  const withMeta = assets.map((a) => ({
    ...a,
    _projectId: projectId,
    _syncedAt: now,
  }));
  await db.assets.bulkPut(withMeta);
}

export async function getCachedProjects(): Promise<CachedProject[]> {
  return db.projects.toArray();
}

export async function getCachedProject(
  id: string
): Promise<CachedProject | undefined> {
  return db.projects.get(id);
}

export async function getCachedEntriesForProject(
  projectId: string
): Promise<CachedJournalEntry[]> {
  return db.journalEntries.where("_projectId").equals(projectId).toArray();
}

export async function getCachedAssetsForProject(
  projectId: string
): Promise<CachedAsset[]> {
  return db.assets.where("_projectId").equals(projectId).toArray();
}

export async function storeAssetBlob(
  filename: string,
  projectId: string,
  blob: Blob,
  mimeType: string
): Promise<void> {
  await db.assetBlobs.put({ filename, projectId, blob, mimeType });
}

export async function getAssetBlob(
  filename: string
): Promise<CachedAssetBlob | undefined> {
  return db.assetBlobs.get(filename);
}

export async function clearProjectCache(projectId: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.projects, db.journalEntries, db.assets, db.assetBlobs],
    async () => {
      await db.projects.delete(projectId);
      await db.journalEntries.where("_projectId").equals(projectId).delete();
      await db.assets.where("_projectId").equals(projectId).delete();
      await db.assetBlobs.where("projectId").equals(projectId).delete();
    }
  );
}

export async function clearAllCache(): Promise<void> {
  await db.transaction(
    "rw",
    [db.projects, db.journalEntries, db.assets, db.assetBlobs],
    async () => {
      await db.projects.clear();
      await db.journalEntries.clear();
      await db.assets.clear();
      await db.assetBlobs.clear();
    }
  );
}

// Sync state helpers
export async function getSyncState<T>(key: string): Promise<T | undefined> {
  const state = await db.syncState.get(key);
  return state?.value as T | undefined;
}

export async function setSyncState(key: string, value: unknown): Promise<void> {
  await db.syncState.put({ key, value });
}
