"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { JournalEntry, AssetMetadata, TimelineItem as TimelineItemType } from "@/types";
import { TimelineItem } from "./timeline-item";

interface TimelineProps {
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
  projectSlug: string;
}

export function Timeline({ entries, assets, projectSlug }: TimelineProps) {
  const items = useMemo<TimelineItemType[]>(() => {
    const journalItems: TimelineItemType[] = entries.map((entry) => ({
      type: "journal" as const,
      date: entry.date,
      data: entry,
    }));

    const assetItems: TimelineItemType[] = assets.map((asset) => ({
      type: "asset" as const,
      date: asset.uploadedAt,
      data: asset,
    }));

    // Combine and sort chronologically (oldest first for timeline growth)
    return [...journalItems, ...assetItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries, assets]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No timeline items yet</h3>
          <p className="text-muted-foreground text-center">
            Add journal entries or upload assets to see your project timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative py-4">
      {/* Desktop vertical spine (center) */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

      {/* Mobile vertical spine (left side) */}
      <div className="md:hidden absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

      {/* Timeline items */}
      <div className="space-y-8">
        {items.map((item, index) => (
          <TimelineItem
            key={`${item.type}-${item.date}-${index}`}
            item={item}
            index={index}
            projectSlug={projectSlug}
          />
        ))}
      </div>
    </div>
  );
}
