"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Image as ImageIcon,
  PenLine,
  Sparkles,
  Layers,
  WifiOff,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import type { CaseStudySection, JournalEntry, AssetMetadata } from "@/types";
import { CASE_STUDY_SECTIONS, TRACKABLE_SECTIONS } from "@/types";
import { SectionCard } from "@/components/case-study/section-card";
import { useOfflineProject } from "@/lib/offline/hooks";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { projectData, isLoading, isOffline, isUsingCache, error } = useOfflineProject(slug);
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

  if (isLoading || !projectData) {
    return (
      <main className="container py-6 sm:py-8">
        <div className="animate-pulse">
          {/* Back link skeleton */}
          <div className="h-4 w-32 bg-muted rounded mb-6" />

          {/* Header skeleton */}
          <div className="space-y-3 mb-8">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-4 w-full max-w-md bg-muted rounded" />
          </div>

          {/* Timeline skeleton - animated typing effect */}
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative py-4" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="absolute -left-6 top-[22px]">
                  <div
                    className="w-3 h-3 rounded-full bg-muted animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                </div>
                <div className="space-y-2">
                  <div
                    className="h-4 bg-muted rounded animate-pulse"
                    style={{
                      width: `${120 + i * 20}px`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                  <div
                    className="h-3 bg-muted/60 rounded animate-pulse"
                    style={{
                      width: `${200 + i * 40}px`,
                      animationDelay: `${i * 150}ms`
                    }}
                  />
                </div>
                {i < 2 && <div className="border-b border-muted mt-4" />}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error && !isUsingCache) {
    return (
      <main className="container py-6 sm:py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
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

  // Calculate progress based on sections with content
  const sectionsWithContent = TRACKABLE_SECTIONS.filter(
    (s) => getEntriesForSection(s).length > 0 || getAssetsForSection(s).length > 0
  );
  const progressPercent = TRACKABLE_SECTIONS.length > 0
    ? Math.round((sectionsWithContent.length / TRACKABLE_SECTIONS.length) * 100)
    : 0;

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

      {/* Offline indicator */}
      {isOffline && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-3 py-2 rounded-lg">
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Showing cached data.</span>
        </div>
      )}

      {/* Project Header */}
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
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
          <p className="text-sm text-muted-foreground">{project.role}</p>
        </div>

        {/* Problem Space */}
        {project.problemSpace && (
          <p className="text-sm text-muted-foreground">{project.problemSpace}</p>
        )}

        {/* Stats & Constraints - Inline */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(project.timeframe.start), "MMM yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            {stats.entriesCount} entries
          </span>
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {stats.assetsCount} assets
          </span>
          {project.constraints.team && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {project.constraints.team}
            </span>
          )}
          {project.constraints.timeline && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {project.constraints.timeline}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {sectionsWithContent.length}/{TRACKABLE_SECTIONS.length} sections
          </span>
        </div>

        {/* Action buttons - hidden on mobile, shown in bottom nav instead */}
        <div className="hidden sm:flex gap-2 pt-1">
          <Link href={`/projects/${slug}/write-up`}>
            <Button variant="outline" size="sm">
              <Edit3 className="mr-1.5 h-4 w-4" />
              Write-Up
            </Button>
          </Link>
          <Link href={`/projects/${slug}/case-study`}>
            <Button variant="outline" size="sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Compile
            </Button>
          </Link>
          <Link href={`/projects/${slug}/journal/new`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs for Journal, Assets, Timeline, and Sections */}
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
          <TabsTrigger value="sections" className="gap-1.5 sm:gap-2 min-w-fit">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Sections</span>
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

        <TabsContent value="sections">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">Case Study Sections</h2>
              <span className="text-sm text-muted-foreground">
                {completedCount} of {TRACKABLE_SECTIONS.length} complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
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
        </TabsContent>
      </Tabs>
    </main>
  );
}
