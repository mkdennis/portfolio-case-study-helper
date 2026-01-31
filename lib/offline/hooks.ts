"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  db,
  cacheProjects,
  cacheJournalEntries,
  cacheAssets,
  getCachedProjects,
  getCachedProject,
  getCachedEntriesForProject,
  getCachedAssetsForProject,
} from "./db";
import type { CachedProject, CachedJournalEntry, CachedAsset } from "./types";
import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";

// Generic fetcher that caches to IndexedDB on success
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }
  return res.json();
}

// Projects list hook with offline fallback
export function useOfflineProjects() {
  const isOnline = useOnlineStatus();
  const [offlineData, setOfflineData] = useState<CachedProject[] | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(true);

  const { data, error, isLoading, mutate } = useSWR<{ projects: ProjectMetadata[] }>(
    "/api/projects",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: async (data) => {
        // Cache projects to IndexedDB
        if (data.projects) {
          await cacheProjects(data.projects as CachedProject[]);
        }
      },
    }
  );

  // Load from cache when offline or on error
  useEffect(() => {
    async function loadFromCache() {
      try {
        const cached = await getCachedProjects();
        setOfflineData(cached);
      } catch {
        // IndexedDB not available
      } finally {
        setOfflineLoading(false);
      }
    }

    if (!isOnline || error) {
      loadFromCache();
    } else {
      setOfflineLoading(false);
    }
  }, [isOnline, error]);

  // Determine which data to return
  const projects = data?.projects ?? ((!isOnline || error) ? offlineData : null);

  return {
    projects,
    isLoading: isLoading && offlineLoading,
    isOffline: !isOnline,
    isUsingCache: !isOnline || !!error,
    error,
    mutate,
  };
}

// Single project hook with offline fallback
interface ProjectData {
  project: ProjectMetadata;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
  stats: {
    entriesCount: number;
    assetsCount: number;
    lastUpdated: string;
  };
}

interface CachedProjectData {
  project: CachedProject;
  entries: CachedJournalEntry[];
  assets: CachedAsset[];
  stats: {
    entriesCount: number;
    assetsCount: number;
    lastUpdated: string;
  };
}

export function useOfflineProject(slug: string) {
  const isOnline = useOnlineStatus();
  const [offlineData, setOfflineData] = useState<CachedProjectData | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(true);

  const { data, error, isLoading, mutate } = useSWR<ProjectData>(
    slug ? `/api/projects/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: async (data) => {
        // Cache to IndexedDB
        if (data.project) {
          await db.projects.put({
            ...data.project,
            _syncedAt: new Date().toISOString(),
          } as CachedProject);
        }
        if (data.entries) {
          await cacheJournalEntries(slug, data.entries as CachedJournalEntry[]);
        }
        if (data.assets) {
          await cacheAssets(slug, data.assets as CachedAsset[]);
        }
      },
    }
  );

  // Load from cache when offline or on error
  useEffect(() => {
    async function loadFromCache() {
      try {
        const project = await getCachedProject(slug);
        if (!project) {
          setOfflineData(null);
          return;
        }

        const entries = await getCachedEntriesForProject(slug);
        const assets = await getCachedAssetsForProject(slug);

        setOfflineData({
          project,
          entries,
          assets,
          stats: {
            entriesCount: entries.length,
            assetsCount: assets.length,
            lastUpdated: project.updatedAt,
          },
        });
      } catch {
        // IndexedDB not available
      } finally {
        setOfflineLoading(false);
      }
    }

    if (!isOnline || error) {
      loadFromCache();
    } else {
      setOfflineLoading(false);
    }
  }, [isOnline, error, slug]);

  // Determine which data to return
  const projectData = data ?? ((!isOnline || error) ? offlineData : null);

  return {
    projectData,
    isLoading: isLoading && offlineLoading,
    isOffline: !isOnline,
    isUsingCache: !isOnline || !!error,
    error,
    mutate,
  };
}

// Single journal entry hook with offline fallback
export function useOfflineEntry(slug: string, date: string) {
  const isOnline = useOnlineStatus();
  const [offlineData, setOfflineData] = useState<JournalEntry | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(true);

  const { data, error, isLoading, mutate } = useSWR<{ entry: JournalEntry }>(
    slug && date ? `/api/journal/${date}?project=${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: async (data) => {
        if (data.entry) {
          await db.journalEntries.put({
            ...data.entry,
            _projectId: slug,
            _syncedAt: new Date().toISOString(),
          } as CachedJournalEntry);
        }
      },
    }
  );

  // Load from cache when offline or on error
  useEffect(() => {
    async function loadFromCache() {
      try {
        const entry = await db.journalEntries
          .where("[_projectId+date]")
          .equals([slug, date])
          .first();
        setOfflineData(entry || null);
      } catch {
        // IndexedDB not available
      } finally {
        setOfflineLoading(false);
      }
    }

    if (!isOnline || error) {
      loadFromCache();
    } else {
      setOfflineLoading(false);
    }
  }, [isOnline, error, slug, date]);

  const entry = data?.entry ?? ((!isOnline || error) ? offlineData : null);

  return {
    entry,
    isLoading: isLoading && offlineLoading,
    isOffline: !isOnline,
    isUsingCache: !isOnline || !!error,
    error,
    mutate,
  };
}
