"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import type { JournalEntry } from "@/types";

interface SelectableJournalCardProps {
  entry: JournalEntry;
}

export function SelectableJournalCard({ entry }: SelectableJournalCardProps) {
  const getContentPreview = () => {
    if (entry.content.text) {
      return entry.content.text;
    }
    if (entry.content.decision) {
      return entry.content.decision;
    }
    if (entry.content.milestone) {
      return entry.content.milestone;
    }
    if (entry.content.tradeoff) {
      return entry.content.tradeoff;
    }
    return "No content";
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(entry.date), "MMM d, yyyy")}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {getContentPreview()}
      </p>
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
