import { db } from "./db";
import type { SyncOperation, SyncConflict } from "./types";

// Store detected conflicts
const conflicts = new Map<string, SyncConflict>();

// Detect if a sync operation has a conflict
export async function detectConflict(
  operation: SyncOperation
): Promise<SyncConflict | null> {
  try {
    // Get the current version from the server
    const response = await fetch(getCheckEndpoint(operation));

    if (!response.ok) {
      // If 404, no conflict - the item doesn't exist remotely
      if (response.status === 404) return null;
      throw new Error(`Failed to check for conflicts: ${response.status}`);
    }

    const remoteData = await response.json();
    const remoteSha = extractSha(operation, remoteData);

    if (!remoteSha) return null;

    // Get local cached SHA
    const localSha = await getLocalSha(operation);

    // If SHAs match, no conflict
    if (localSha === remoteSha) return null;

    // If local SHA is undefined (new local item), no conflict
    if (!localSha) return null;

    // Conflict detected
    const conflict: SyncConflict = {
      operationId: operation.id,
      entityType: operation.type,
      entityId: operation.entityId,
      localVersion: operation.payload,
      remoteVersion: remoteData,
      remoteSha,
      detectedAt: new Date().toISOString(),
    };

    conflicts.set(operation.id, conflict);
    return conflict;
  } catch (error) {
    console.error("Error detecting conflict:", error);
    return null;
  }
}

function getCheckEndpoint(operation: SyncOperation): string {
  switch (operation.type) {
    case "project":
      return `/api/projects/${operation.entityId}`;
    case "journal":
      return `/api/journal/${operation.entityId}?project=${operation.projectId}`;
    case "asset":
      return `/api/assets/${operation.entityId}?project=${operation.projectId}`;
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

function extractSha(operation: SyncOperation, data: Record<string, unknown>): string | null {
  switch (operation.type) {
    case "project":
      return (data._sha as string) || null;
    case "journal":
      return ((data.entry as Record<string, unknown>)?._sha as string) || null;
    case "asset":
      return ((data.asset as Record<string, unknown>)?._sha as string) || null;
    default:
      return null;
  }
}

async function getLocalSha(operation: SyncOperation): Promise<string | undefined> {
  switch (operation.type) {
    case "project": {
      const project = await db.projects.get(operation.entityId);
      return project?._sha;
    }
    case "journal": {
      const entry = await db.journalEntries
        .where("[_projectId+date]")
        .equals([operation.projectId, operation.entityId])
        .first();
      return entry?._sha;
    }
    case "asset": {
      const asset = await db.assets.get(operation.entityId);
      return asset?._sha;
    }
    default:
      return undefined;
  }
}

// Get all detected conflicts
export function getConflicts(): SyncConflict[] {
  return Array.from(conflicts.values());
}

// Get a specific conflict
export function getConflict(operationId: string): SyncConflict | undefined {
  return conflicts.get(operationId);
}

// Resolve conflict by keeping local version
export async function resolveWithLocal(operationId: string): Promise<void> {
  const conflict = conflicts.get(operationId);
  if (!conflict) return;

  // Update the sync operation to use the new remote SHA
  // This allows it to overwrite the remote version
  await db.syncQueue.update(operationId, {
    status: "pending",
    error: undefined,
  });

  // Store the new SHA so the next sync attempt can use it
  await updateLocalSha(conflict);

  conflicts.delete(operationId);
}

// Resolve conflict by keeping remote version
export async function resolveWithRemote(operationId: string): Promise<void> {
  const conflict = conflicts.get(operationId);
  if (!conflict) return;

  // Update local cache with remote version
  await updateLocalWithRemote(conflict);

  // Remove the operation from queue since we're discarding local changes
  await db.syncQueue.delete(operationId);

  conflicts.delete(operationId);
}

async function updateLocalSha(conflict: SyncConflict): Promise<void> {
  switch (conflict.entityType) {
    case "project":
      await db.projects.update(conflict.entityId, { _sha: conflict.remoteSha });
      break;
    case "journal":
      // Find and update the entry
      const entries = await db.journalEntries
        .where("date")
        .equals(conflict.entityId)
        .toArray();
      for (const entry of entries) {
        await db.journalEntries.update(entry.date, { _sha: conflict.remoteSha });
      }
      break;
    case "asset":
      await db.assets.update(conflict.entityId, { _sha: conflict.remoteSha });
      break;
  }
}

async function updateLocalWithRemote(conflict: SyncConflict): Promise<void> {
  const remote = conflict.remoteVersion as Record<string, unknown>;

  switch (conflict.entityType) {
    case "project": {
      const project = remote.project as Record<string, unknown>;
      if (project) {
        await db.projects.put({
          ...project,
          _sha: conflict.remoteSha,
          _syncedAt: new Date().toISOString(),
        } as Parameters<typeof db.projects.put>[0]);
      }
      break;
    }
    case "journal": {
      const entry = remote.entry as Record<string, unknown>;
      if (entry) {
        await db.journalEntries.put({
          ...entry,
          _sha: conflict.remoteSha,
          _syncedAt: new Date().toISOString(),
        } as Parameters<typeof db.journalEntries.put>[0]);
      }
      break;
    }
    case "asset": {
      const asset = remote.asset as Record<string, unknown>;
      if (asset) {
        await db.assets.put({
          ...asset,
          _sha: conflict.remoteSha,
          _syncedAt: new Date().toISOString(),
        } as Parameters<typeof db.assets.put>[0]);
      }
      break;
    }
  }
}

// Clear all conflicts
export function clearConflicts(): void {
  conflicts.clear();
}

// Check if there are any conflicts
export function hasConflicts(): boolean {
  return conflicts.size > 0;
}
