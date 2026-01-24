"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectMetadata, JournalEntry, AssetMetadata, CaseStudySection } from "@/types";
import { CASE_STUDY_SECTIONS, TRACKABLE_SECTIONS } from "@/types";
import { SectionCard } from "@/components/case-study/section-card";

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
  const [completedSections, setCompletedSections] = useState<Set<CaseStudySection>>(new Set());

  const toggleSectionComplete = (section: CaseStudySection) => {
    setCompletedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const completedCount = TRACKABLE_SECTIONS.filter(s => completedSections.has(s)).length;

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
      <main className="container py-6 sm:py-8">
        <Skeleton className="h-8 w-48 mb-6 sm:mb-8" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-6 sm:py-8">
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
      <main className="container py-6 sm:py-8">
        <p>Project not found</p>
      </main>
    );
  }

  const { project, entries, assets, stats } = projectData;

  function getEntriesForSection(section: CaseStudySection): JournalEntry[] {
    return entries.filter((entry) => entry.section === section);
  }

  function getAssetsForSection(section: CaseStudySection): Array<AssetMetadata & { url: string }> {
    return assets.filter((asset) => asset.linkedSections.includes(section));
  }

  return (
    <main className="container py-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Project Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
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
        {/* Action buttons - hidden on mobile, shown in bottom nav instead */}
        <div className="hidden sm:flex gap-2">
          <Link href={`/projects/${slug}/case-study`}>
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Compile Case Study
            </Button>
          </Link>
          <Link href={`/projects/${slug}/journal/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Journal Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - 2x2 on mobile, 4 columns on md+ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.entriesCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.assetsCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  {format(new Date(project.timeframe.start), "MMM d, yyyy")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Started</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  {format(new Date(stats.lastUpdated), "MMM d, yyyy")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Space & Constraints */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Problem Space</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-muted-foreground">{project.problemSpace}</p>

          {(project.constraints.team ||
            project.constraints.timeline ||
            project.constraints.scope ||
            project.constraints.technical) && (
            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2">
              {project.constraints.team && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
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
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
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

      {/* Case Study Sections */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Case Study Sections</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {TRACKABLE_SECTIONS.length} complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${TRACKABLE_SECTIONS.length > 0 ? (completedCount / TRACKABLE_SECTIONS.length) * 100 : 0}%` }}
          />
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {CASE_STUDY_SECTIONS.map((section) => (
            <SectionCard
              key={section}
              section={section}
              entries={getEntriesForSection(section)}
              assets={getAssetsForSection(section)}
              projectSlug={slug}
              isComplete={completedSections.has(section)}
              onToggleComplete={() => toggleSectionComplete(section)}
            />
          ))}
        </div>
      </div>

      {/* Tabs for Journal, Assets, and Timeline */}
      <Tabs defaultValue="journal" className="space-y-4">
        <TabsList className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <TabsTrigger value="journal" className="gap-1.5 sm:gap-2 min-w-fit">
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Journal</span> ({stats.entriesCount})
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5 sm:gap-2 min-w-fit">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Assets</span> ({stats.assetsCount})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 sm:gap-2 min-w-fit">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
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
  );
}
