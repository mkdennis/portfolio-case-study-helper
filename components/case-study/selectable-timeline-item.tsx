"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { TimelineItem } from "@/types";
import { useCaseStudy } from "./case-study-context";
import { SelectableJournalCard } from "./selectable-journal-card";
import { SelectableAssetCard } from "./selectable-asset-card";

interface SelectableTimelineItemProps {
  item: TimelineItem;
  itemId: string;
}

export function SelectableTimelineItem({
  item,
  itemId,
}: SelectableTimelineItemProps) {
  const { isSelected, toggle, getSelectionOrder } = useCaseStudy();
  const selected = isSelected(itemId);
  const order = getSelectionOrder(itemId);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-muted-foreground/50"
      )}
      onClick={() => toggle(itemId, item)}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => toggle(itemId, item)}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
      />

      {item.type === "journal" ? (
        <SelectableJournalCard entry={item.data} />
      ) : (
        <SelectableAssetCard asset={item.data} />
      )}

      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shadow-sm">
          {order}
        </div>
      )}
    </div>
  );
}
