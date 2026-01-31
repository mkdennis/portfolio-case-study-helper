import { db } from "./db";
import { detectConflict, hasConflicts } from "./conflict";
import type { SyncOperation, SyncStatus } from "./types";

// Generate a unique ID for operations
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class SyncQueueManager {
  private isProcessing = false;
  private onlineListener: (() => void) | null = null;

  constructor() {
    // Listen for online events to trigger sync
    if (typeof window !== "undefined") {
      this.onlineListener = () => {
        this.processQueue();
      };
      window.addEventListener("online", this.onlineListener);
    }
  }

  destroy() {
    if (this.onlineListener && typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineListener);
    }
  }

  // Add operation to queue
  async enqueue(
    operation: Omit<SyncOperation, "id" | "status" | "retryCount" | "createdAt">
  ): Promise<string> {
    const id = generateId();
    const syncOp: SyncOperation = {
      ...operation,
      id,
      status: "pending",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await db.syncQueue.add(syncOp);
    return id;
  }

  // Get pending operations count
  async getPendingCount(): Promise<number> {
    return db.syncQueue
      .where("status")
      .anyOf(["pending", "syncing", "failed"])
      .count();
  }

  // Get all pending operations
  async getPendingOperations(): Promise<SyncOperation[]> {
    return db.syncQueue
      .where("status")
      .anyOf(["pending", "failed"])
      .sortBy("createdAt");
  }

  // Check if dependencies are resolved
  private async areDependenciesResolved(operation: SyncOperation): Promise<boolean> {
    if (operation.dependencies.length === 0) return true;

    const deps = await db.syncQueue
      .where("id")
      .anyOf(operation.dependencies)
      .toArray();

    // All dependencies must be completed
    return deps.every((dep) => dep.status === "completed");
  }

  // Process the sync queue
  async processQueue(): Promise<{ hasConflicts: boolean }> {
    if (this.isProcessing) return { hasConflicts: false };
    if (typeof navigator !== "undefined" && !navigator.onLine) return { hasConflicts: false };

    this.isProcessing = true;
    let conflictsDetected = false;

    try {
      const pending = await this.getPendingOperations();

      for (const operation of pending) {
        // Skip if dependencies not resolved
        const depsResolved = await this.areDependenciesResolved(operation);
        if (!depsResolved) continue;

        // Check for conflicts before syncing (only for updates)
        if (operation.action === "update") {
          const conflict = await detectConflict(operation);
          if (conflict) {
            conflictsDetected = true;
            await db.syncQueue.update(operation.id, {
              status: "failed" as SyncStatus,
              error: "Conflict detected - resolve before syncing",
            });
            continue;
          }
        }

        // Mark as syncing
        await this.updateStatus(operation.id, "syncing");

        try {
          await this.executeOperation(operation);
          await this.updateStatus(operation.id, "completed");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await db.syncQueue.update(operation.id, {
            status: "failed" as SyncStatus,
            retryCount: operation.retryCount + 1,
            error: errorMessage,
          });

          // If max retries reached, stop trying this operation
          if (operation.retryCount >= 3) {
            console.error(`Operation ${operation.id} failed after max retries:`, errorMessage);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { hasConflicts: conflictsDetected || hasConflicts() };
  }

  // Execute a single sync operation
  private async executeOperation(operation: SyncOperation): Promise<void> {
    const endpoint = this.getEndpoint(operation);
    const method = this.getMethod(operation);
    const body = this.getBody(operation);

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  private getEndpoint(operation: SyncOperation): string {
    switch (operation.type) {
      case "project":
        return operation.action === "create"
          ? "/api/projects"
          : `/api/projects/${operation.entityId}`;
      case "journal":
        return "/api/journal";
      case "asset":
        return "/api/assets";
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private getMethod(operation: SyncOperation): string {
    switch (operation.action) {
      case "create":
        return "POST";
      case "update":
        return "PATCH";
      case "delete":
        return "DELETE";
      default:
        return "POST";
    }
  }

  private getBody(operation: SyncOperation): unknown {
    return operation.payload;
  }

  private async updateStatus(id: string, status: SyncStatus): Promise<void> {
    const updates: Partial<SyncOperation> = { status };
    if (status === "completed") {
      updates.completedAt = new Date().toISOString();
    }
    await db.syncQueue.update(id, updates);
  }

  // Retry a failed operation
  async retryOperation(id: string): Promise<void> {
    await this.updateStatus(id, "pending");
    await this.processQueue();
  }

  // Cancel a pending operation
  async cancelOperation(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  }

  // Clear completed operations
  async clearCompleted(): Promise<void> {
    await db.syncQueue.where("status").equals("completed").delete();
  }
}

// Singleton instance
let syncQueueInstance: SyncQueueManager | null = null;

export function getSyncQueue(): SyncQueueManager {
  if (!syncQueueInstance) {
    syncQueueInstance = new SyncQueueManager();
  }
  return syncQueueInstance;
}
