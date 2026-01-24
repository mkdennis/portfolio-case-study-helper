"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";

import {
  CaseStudyProvider,
  CaseStudyLayout,
  SelectableTimeline,
  HTMLPreview,
} from "@/components/case-study";

interface ProjectData {
  project: ProjectMetadata;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
}

export default function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch project");
        }

        const data = await res.json();
        setProjectData(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch project"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [slug, router]);

  if (isLoading) {
    return (
      <main className="flex-1 container py-4 flex flex-col">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-full min-h-[400px]" />
          <Skeleton className="h-full min-h-[400px] hidden lg:block" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 container py-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!projectData) {
    return (
      <main className="flex-1 container py-4">
        <p>Project not found</p>
      </main>
    );
  }

  const { project, entries, assets } = projectData;

  return (
    <main className="flex-1 container py-4 flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to {project.name}</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <h1 className="text-base sm:text-lg font-semibold">Case Study Compiler</h1>
      </div>

      <CaseStudyProvider>
        <CaseStudyLayout>
          <SelectableTimeline entries={entries} assets={assets} />
          <HTMLPreview project={project} />
        </CaseStudyLayout>
      </CaseStudyProvider>
    </main>
  );
}
