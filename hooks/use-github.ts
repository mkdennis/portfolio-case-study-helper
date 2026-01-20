"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import type { SessionWithToken } from "@/lib/auth";

// Custom fetcher that includes the access token
async function fetcher<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch");
  }

  return res.json();
}

export function useGitHubSession() {
  const { data: session, status } = useSession();

  return {
    session: session as SessionWithToken | null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

export function useAppConfig(owner: string, repo: string) {
  const { session } = useGitHubSession();

  return useSWR(
    session?.accessToken ? [`/api/config`, owner, repo] : null,
    () => fetcher(`/api/config?owner=${owner}&repo=${repo}`, session!.accessToken),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useProjects(owner: string, repo: string) {
  const { session } = useGitHubSession();

  return useSWR(
    session?.accessToken && owner && repo ? [`/api/projects`, owner, repo] : null,
    () => fetcher(`/api/projects?owner=${owner}&repo=${repo}`, session!.accessToken),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useProject(owner: string, repo: string, slug: string) {
  const { session } = useGitHubSession();

  return useSWR(
    session?.accessToken && owner && repo && slug
      ? [`/api/projects`, owner, repo, slug]
      : null,
    () =>
      fetcher(
        `/api/projects/${slug}?owner=${owner}&repo=${repo}`,
        session!.accessToken
      ),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useJournalEntries(owner: string, repo: string, projectSlug: string) {
  const { session } = useGitHubSession();

  return useSWR(
    session?.accessToken && owner && repo && projectSlug
      ? [`/api/journal`, owner, repo, projectSlug]
      : null,
    () =>
      fetcher(
        `/api/journal?owner=${owner}&repo=${repo}&project=${projectSlug}`,
        session!.accessToken
      ),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useAssets(owner: string, repo: string, projectSlug: string) {
  const { session } = useGitHubSession();

  return useSWR(
    session?.accessToken && owner && repo && projectSlug
      ? [`/api/assets`, owner, repo, projectSlug]
      : null,
    () =>
      fetcher(
        `/api/assets?owner=${owner}&repo=${repo}&project=${projectSlug}`,
        session!.accessToken
      ),
    {
      revalidateOnFocus: false,
    }
  );
}
