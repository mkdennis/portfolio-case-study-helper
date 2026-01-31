"use client";

import { WifiOff, Cloud, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOfflineStatus } from "@/hooks/use-online-status";
import { getSyncQueue } from "@/lib/offline/sync-queue";
import { ConflictDialog } from "./conflict-dialog";
import { useState } from "react";

export function OfflineIndicator() {
  const { isOnline, pendingCount, hasConflicts, refreshStatus } = useOfflineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const syncQueue = getSyncQueue();
      const result = await syncQueue.processQueue();
      await refreshStatus();

      // Show conflict dialog if conflicts were detected
      if (result.hasConflicts) {
        setShowConflictDialog(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConflictResolved = async () => {
    await refreshStatus();
    // Try syncing again after conflicts are resolved
    handleSync();
  };

  // Don't show anything if online and no pending operations
  if (isOnline && pendingCount === 0 && !hasConflicts) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {!isOnline && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          <WifiOff className="h-4 w-4" />
          Offline
        </Badge>
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Cloud className="h-4 w-4" />
            {pendingCount} pending
          </Badge>
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-7"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          )}
        </div>
      )}

      {hasConflicts && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConflictDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm h-auto"
        >
          <AlertTriangle className="h-4 w-4" />
          Resolve conflicts
        </Button>
      )}

      <ConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        onResolved={handleConflictResolved}
      />
    </div>
  );
}
