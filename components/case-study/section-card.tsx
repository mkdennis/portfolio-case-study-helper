"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Image as ImageIcon, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { JournalEntry, AssetMetadata, CaseStudySection } from "@/types";
import { CASE_STUDY_SECTION_LABELS } from "@/types";
import Link from "next/link";

interface SectionCardProps {
  section: CaseStudySection;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
  projectSlug: string;
}

export function SectionCard({ section, entries, assets, projectSlug }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(entries.length > 0 || assets.length > 0);
  const isEmpty = entries.length === 0 && assets.length === 0;

  return (
    <Card className={isEmpty ? "opacity-60" : ""}>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {CASE_STUDY_SECTION_LABELS[section]}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {assets.length} {assets.length === 1 ? "asset" : "assets"}
          </Badge>
          <Link
            href={`/projects/${projectSlug}/journal/new?section=${section}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Entry
            </Button>
          </Link>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              No entries or assets linked to this section yet.
            </p>
          ) : (
            <>
              {entries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Journal Entries</h4>
                  {entries.map((entry) => (
                    <Link
                      key={entry.date}
                      href={`/projects/${projectSlug}/journal/${entry.date}`}
                      className="block p-3 rounded-lg border hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(entry.date), "MMM d, yyyy")}
                      </div>
                      {entry.content.text && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content.text}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {assets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Assets</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {assets.map((asset) => (
                      <div
                        key={asset.filename}
                        className="aspect-video relative bg-muted rounded-lg overflow-hidden"
                      >
                        {asset.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.url}
                            alt={asset.altText || asset.filename}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
