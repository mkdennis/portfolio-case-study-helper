"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { JournalEntryList } from "@/components/journal/entry-list";
import { AssetGallery } from "@/components/assets/asset-gallery";
import { Timeline } from "@/components/timeline";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Clock,
  FileText,
  Image as ImageIcon,
  PenLine,
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectMetadata, JournalEntry, AssetMetadata } from "@/types";

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

export default function ProjectPage({
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
        setError(err instanceof Error ? err.message : "Failed to fetch project");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <p>Project not found</p>
        </main>
      </div>
    );
  }

  const { project, entries, assets, stats } = projectData;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge
                variant={
                  project.timeframe.status === "completed"
                    ? "secondary"
                    : project.timeframe.status === "paused"
                    ? "outline"
                    : "default"
                }
              >
                {project.timeframe.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.role}</p>
          </div>
          <Link href={`/projects/${slug}/journal/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Journal Entry
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.entriesCount}</p>
                  <p className="text-sm text-muted-foreground">Journal Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assetsCount}</p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(project.timeframe.start), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">Started</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(stats.lastUpdated), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem Space & Constraints */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Problem Space</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.problemSpace}</p>

            {(project.constraints.team ||
              project.constraints.timeline ||
              project.constraints.scope ||
              project.constraints.technical) && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {project.constraints.team && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Team</p>
                      <p className="text-sm text-muted-foreground">
                        {project.constraints.team}
                      </p>
                    </div>
                  </div>
                )}
                {project.constraints.timeline && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Timeline</p>
                      <p className="text-sm text-muted-foreground">
                        {project.constraints.timeline}
                      </p>
                    </div>
                  </div>
                )}
                {project.constraints.scope && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Scope</p>
                      <p className="text-sm text-muted-foreground">
                        {project.constraints.scope}
                      </p>
                    </div>
                  </div>
                )}
                {project.constraints.technical && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Technical</p>
                      <p className="text-sm text-muted-foreground">
                        {project.constraints.technical}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Journal, Assets, and Timeline */}
        <Tabs defaultValue="journal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="journal" className="gap-2">
              <PenLine className="h-4 w-4" />
              Journal ({stats.entriesCount})
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Assets ({stats.assetsCount})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal">
            <JournalEntryList
              entries={entries}
              projectSlug={slug}
            />
          </TabsContent>

          <TabsContent value="assets">
            <AssetGallery
              assets={assets}
              projectSlug={slug}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <Timeline
              entries={entries}
              assets={assets}
              projectSlug={slug}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
