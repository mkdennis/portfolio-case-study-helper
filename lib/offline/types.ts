import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";

// Cached versions with sync metadata
export interface CachedProject extends ProjectMetadata {
  _sha?: string;
  _syncedAt?: string;
}

export interface CachedJournalEntry extends JournalEntry {
  _projectId: string;
  _sha?: string;
  _syncedAt?: string;
}

export interface CachedAsset extends AssetMetadata {
  _projectId: string;
  _sha?: string;
  _syncedAt?: string;
  url: string;
}

export interface CachedAssetBlob {
  filename: string;
  projectId: string;
  blob: Blob;
  mimeType: string;
}

// Sync queue types
export type SyncOperationType = "project" | "journal" | "asset";
export type SyncAction = "create" | "update" | "delete";
export type SyncStatus = "pending" | "syncing" | "failed" | "completed";

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  action: SyncAction;
  entityId: string;
  projectId: string;
  payload: unknown;
  dependencies: string[]; // IDs of operations that must complete first
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  error?: string;
  completedAt?: string;
}

// Sync state metadata
export interface SyncState {
  key: string;
  value: unknown;
}

// Payload types for queue
export interface CreateJournalPayload {
  projectSlug: string;
  date: string;
  text: string;
  tags: string[];
  section?: string;
  assets?: string[];
}

export interface CreateAssetPayload {
  projectSlug: string;
  filename: string;
  role: string;
  altText: string;
}

export interface CreateProjectPayload {
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
}

// Conflict types
export interface SyncConflict {
  operationId: string;
  entityType: SyncOperationType;
  entityId: string;
  localVersion: unknown;
  remoteVersion: unknown;
  remoteSha: string;
  detectedAt: string;
}
