"use client";

import { useMemo } from "react";
import type { JournalEntry, AssetMetadata, TimelineItem } from "@/types";
import { SelectableTimelineItem } from "./selectable-timeline-item";
import { useCaseStudy } from "./case-study-context";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, Clock } from "lucide-react";

interface SelectableTimelineProps {
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
}

function generateItemId(item: TimelineItem, index: number): string {
  return `${item.type}-${item.date}-${index}`;
}

export function SelectableTimeline({
  entries,
  assets,
}: SelectableTimelineProps) {
  const { state, selectAll, clear } = useCaseStudy();

  const items = useMemo<TimelineItem[]>(() => {
    const journalItems: TimelineItem[] = entries.map((entry) => ({
      type: "journal" as const,
      date: entry.date,
      data: entry,
    }));

    const assetItems: TimelineItem[] = assets.map((asset) => ({
      type: "asset" as const,
      date: asset.uploadedAt,
      data: asset,
    }));

    return [...journalItems, ...assetItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries, assets]);

  const itemsWithIds = useMemo(
    () =>
      items.map((item, index) => ({
        id: generateItemId(item, index),
        item,
      })),
    [items]
  );

  const allSelected =
    items.length > 0 &&
    itemsWithIds.every(({ id }) => state.selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) {
      clear();
    } else {
      selectAll(itemsWithIds);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No timeline items</h3>
        <p className="text-muted-foreground">
          Add journal entries or assets to your project first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <span className="text-sm text-muted-foreground">
          {state.selectedIds.size} of {items.length} selected
        </span>
        <Button variant="ghost" size="sm" onClick={handleToggleAll}>
          {allSelected ? (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <Square className="h-4 w-4 mr-2" />
              Select All
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {itemsWithIds.map(({ id, item }) => (
          <SelectableTimelineItem key={id} item={item} itemId={id} />
        ))}
      </div>
    </div>
  );
}
