"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import type { JournalEntry } from "@/types";

interface TimelineJournalCardProps {
  entry: JournalEntry;
  projectSlug: string;
}

export function TimelineJournalCard({ entry, projectSlug }: TimelineJournalCardProps) {
  return (
    <Link href={`/projects/${projectSlug}/journal/${entry.date}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {format(new Date(entry.date), "MMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {entry.content.decision && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Decision
                </span>
                <p className="text-sm line-clamp-2">{entry.content.decision}</p>
              </div>
            )}
            {!entry.content.decision && entry.content.milestone && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Milestone
                </span>
                <p className="text-sm line-clamp-2">{entry.content.milestone}</p>
              </div>
            )}
            {!entry.content.decision && !entry.content.milestone && entry.content.tradeoff && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Tradeoff
                </span>
                <p className="text-sm line-clamp-2">{entry.content.tradeoff}</p>
              </div>
            )}
          </div>

          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
