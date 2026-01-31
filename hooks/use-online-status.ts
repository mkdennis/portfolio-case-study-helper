"use client";

import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state based on navigator (only available client-side)
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineStatus() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [hasConflicts, setHasConflicts] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { db } = await import("@/lib/offline/db");
      const pending = await db.syncQueue
        .where("status")
        .anyOf(["pending", "syncing", "failed"])
        .count();
      setPendingCount(pending);

      // Check for conflicts (failed operations)
      const failed = await db.syncQueue.where("status").equals("failed").count();
      setHasConflicts(failed > 0);
    } catch {
      // IndexedDB not available (SSR)
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    // Refresh on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshStatus]);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingCount,
    hasConflicts,
    refreshStatus,
  };
}
