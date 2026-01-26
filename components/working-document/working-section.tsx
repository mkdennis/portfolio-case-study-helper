"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import type {
  WorkingDocumentSection,
  WorkingDocumentSectionData,
  JournalEntry,
  AssetMetadata,
} from "@/types";
import {
  WORKING_DOCUMENT_SECTION_LABELS,
  WORKING_DOCUMENT_SECTION_PROMPTS,
} from "@/types";

interface WorkingSectionProps {
  section: WorkingDocumentSection;
  data: WorkingDocumentSectionData;
  relatedEntries: JournalEntry[];
  relatedAssets: Array<AssetMetadata & { url: string }>;
  projectSlug: string;
  onChange: (content: string) => void;
  onHelpMeWrite: () => void;
}

export function WorkingSection({
  section,
  data,
  relatedEntries,
  relatedAssets,
  projectSlug,
  onChange,
  onHelpMeWrite,
}: WorkingSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, [data.content]);

  const hasRelated = relatedEntries.length > 0 || relatedAssets.length > 0;

  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {WORKING_DOCUMENT_SECTION_LABELS[section]}
          </CardTitle>
          {hasRelated && (
            <Badge variant="secondary" className="text-xs">
              {relatedEntries.length + relatedAssets.length} related
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
          {/* Writing prompt hint */}
          <p className="text-sm text-muted-foreground italic">
            {WORKING_DOCUMENT_SECTION_PROMPTS[section]}
          </p>

          {/* Text editor */}
          <Textarea
            ref={textareaRef}
            value={data.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Write about ${WORKING_DOCUMENT_SECTION_LABELS[section].toLowerCase()}...`}
            className="min-h-[120px] resize-none"
          />

          {/* Action buttons */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onHelpMeWrite();
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Help me write
            </Button>
          </div>

          {/* Related notes - always visible when there are related items */}
          {hasRelated && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Related Notes ({relatedEntries.length + relatedAssets.length})
              </h4>

              {relatedEntries.length > 0 && (
                <div className="space-y-2">
                  {relatedEntries.map((entry) => {
                    // Check if new format (has text) or legacy format (has sections)
                    const isNewFormat = !!entry.content.text;
                    const legacySections = [
                      { key: "decision", label: "Decision", content: entry.content.decision },
                      { key: "why", label: "Why", content: entry.content.why },
                      { key: "milestone", label: "Milestone", content: entry.content.milestone },
                      { key: "change", label: "What Changed", content: entry.content.change },
                      { key: "tradeoff", label: "Tradeoff", content: entry.content.tradeoff },
                      { key: "feedback", label: "Feedback", content: entry.content.feedback },
                    ].filter((s) => s.content);

                    return (
                      <a
                        key={entry.date}
                        href={`/projects/${projectSlug}/journal/${entry.date}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {isNewFormat ? (
                          <p className="text-sm whitespace-pre-wrap">{entry.content.text}</p>
                        ) : (
                          <div className="space-y-2">
                            {legacySections.map((section) => (
                              <div key={section.key}>
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  {section.label}
                                </span>
                                <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}

              {relatedAssets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Related Assets
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {relatedAssets.map((asset) => (
                      <div
                        key={asset.filename}
                        className="aspect-video relative bg-muted rounded-lg overflow-hidden group"
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
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white px-2 text-center">
                            {asset.suggestedName || asset.filename}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
    </Card>
  );
}
