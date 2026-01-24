"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image as ImageIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCaseStudy } from "./case-study-context";
import type {
  CaseStudySection,
  JournalEntry,
  AssetMetadata,
  TimelineItem,
} from "@/types";
import { CASE_STUDY_SECTION_LABELS } from "@/types";

interface ArtifactPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: CaseStudySection | null;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
}

function generateItemId(item: TimelineItem, index: number): string {
  return `${item.type}-${item.date}-${index}`;
}

export function ArtifactPicker({
  open,
  onOpenChange,
  section,
  entries,
  assets,
}: ArtifactPickerProps) {
  const { isItemUsed, getItemSection, addToSection } = useCaseStudy();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const items = useMemo<Array<{ id: string; item: TimelineItem }>>(() => {
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

    const allItems = [...journalItems, ...assetItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return allItems.map((item, index) => ({
      id: generateItemId(item, index),
      item,
    }));
  }, [entries, assets]);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = () => {
    if (!section) return;

    for (const { id, item } of items) {
      if (selectedIds.has(id)) {
        addToSection(section, id, item);
      }
    }

    setSelectedIds(new Set());
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Add to {section ? CASE_STUDY_SECTION_LABELS[section] : "Section"}
          </DialogTitle>
          <DialogDescription>
            Select journal entries and assets to add to this section.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No artifacts available. Add journal entries or assets first.
              </p>
            ) : (
              items.map(({ id, item }) => {
                const usedInSection = getItemSection(id);
                const isUsed = isItemUsed(id);
                const isSelected = selectedIds.has(id);
                const isDisabled = isUsed && usedInSection !== section;

                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      !isDisabled && "cursor-pointer hover:bg-muted/50",
                      isSelected && "border-primary bg-primary/5"
                    )}
                    onClick={() => !isDisabled && handleToggle(id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => handleToggle(id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />

                    {item.type === "journal" ? (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium">
                            {format(new Date(item.date), "MMM d, yyyy")}
                          </span>
                          {item.data.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.data.content.text ||
                            item.data.content.decision ||
                            item.data.content.milestone ||
                            "No content"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                          {item.data.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.data.url}
                              alt={item.data.altText || item.data.filename}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {item.data.filename}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.data.role}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {usedInSection && (
                      <Badge
                        variant="secondary"
                        className="text-xs shrink-0 flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        {CASE_STUDY_SECTION_LABELS[usedInSection]}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
            Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
