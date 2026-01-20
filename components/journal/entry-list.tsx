"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { JournalEntry } from "@/types";

interface JournalEntryListProps {
  entries: JournalEntry[];
  projectSlug: string;
}

export function JournalEntryList({
  entries,
  projectSlug,
}: JournalEntryListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Start documenting your design decisions and progress.
          </p>
          <Link href={`/projects/${projectSlug}/journal/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add First Entry
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Link
          key={entry.date}
          href={`/projects/${projectSlug}/journal/${entry.date}`}
        >
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entry.content.decision && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Decision
                    </span>
                    <p className="text-sm line-clamp-2">{entry.content.decision}</p>
                  </div>
                )}
                {entry.content.milestone && (
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
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {entry.assets.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {entry.assets.length} asset{entry.assets.length !== 1 ? "s" : ""} attached
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
