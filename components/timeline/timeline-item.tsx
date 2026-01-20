"use client";

import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import type { TimelineItem as TimelineItemType } from "@/types";
import { TimelineJournalCard } from "./timeline-journal-card";
import { TimelineAssetCard } from "./timeline-asset-card";

interface TimelineItemProps {
  item: TimelineItemType;
  index: number;
  projectSlug: string;
}

export function TimelineItem({ item, index, projectSlug }: TimelineItemProps) {
  const { ref, isInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={cn(
        "timeline-item-hidden",
        isInView && (isLeft ? "timeline-item-visible-left" : "timeline-item-visible-right")
      )}
    >
      {/* Desktop layout: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-4">
        {isLeft ? (
          <>
            {/* Card on left */}
            <div className="flex justify-end">
              {item.type === "journal" ? (
                <TimelineJournalCard entry={item.data} projectSlug={projectSlug} />
              ) : (
                <TimelineAssetCard asset={item.data} />
              )}
            </div>
            {/* Dot in center */}
            <div className="flex justify-center items-start pt-4">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-background z-10 shadow-sm",
                  item.type === "journal" ? "bg-primary" : "bg-chart-2"
                )}
              />
            </div>
            {/* Empty right */}
            <div />
          </>
        ) : (
          <>
            {/* Empty left */}
            <div />
            {/* Dot in center */}
            <div className="flex justify-center items-start pt-4">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-background z-10 shadow-sm",
                  item.type === "journal" ? "bg-primary" : "bg-chart-2"
                )}
              />
            </div>
            {/* Card on right */}
            <div className="flex justify-start">
              {item.type === "journal" ? (
                <TimelineJournalCard entry={item.data} projectSlug={projectSlug} />
              ) : (
                <TimelineAssetCard asset={item.data} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile layout: 2-column with dot on left */}
      <div className="md:hidden grid grid-cols-[auto_1fr] gap-4">
        <div className="flex justify-center items-start pt-4">
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 border-background z-10 shadow-sm",
              item.type === "journal" ? "bg-primary" : "bg-chart-2"
            )}
          />
        </div>
        <div>
          {item.type === "journal" ? (
            <TimelineJournalCard entry={item.data} projectSlug={projectSlug} />
          ) : (
            <TimelineAssetCard asset={item.data} />
          )}
        </div>
      </div>
    </div>
  );
}
