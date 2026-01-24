"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Sparkles,
  MessageCircle,
  Lightbulb,
  FileText,
  Check,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  WorkingDocumentSection,
  AISuggestion,
  JournalEntry,
  AssetMetadata,
} from "@/types";
import { WORKING_DOCUMENT_SECTION_LABELS } from "@/types";

interface AIWritingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  section: WorkingDocumentSection;
  currentContent: string;
  relatedEntries: JournalEntry[];
  relatedAssets: Array<AssetMetadata & { url: string }>;
  projectName: string;
  problemSpace: string;
  onAcceptSuggestion: (text: string) => void;
}

export function AIWritingAssistant({
  isOpen,
  onClose,
  section,
  currentContent,
  relatedEntries,
  relatedAssets,
  projectName,
  problemSpace,
  onAcceptSuggestion,
}: AIWritingAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/writing-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          currentContent,
          relatedEntries: relatedEntries.map((e) => ({
            date: e.date,
            tags: e.tags,
            content: e.content.text || "",
          })),
          relatedAssets: relatedAssets.map((a) => ({
            filename: a.filename,
            altText: a.altText,
            role: a.role,
          })),
          projectName,
          problemSpace,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get suggestions");
      }

      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError("Unable to get AI suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [section, currentContent, relatedEntries, relatedAssets, projectName, problemSpace]);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
      setAcceptedIds(new Set());
    }
  }, [isOpen, fetchSuggestions]);

  const handleAccept = (suggestion: AISuggestion) => {
    onAcceptSuggestion(suggestion.content);
    setAcceptedIds((prev) => new Set(prev).add(suggestion.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Help me write: {WORKING_DOCUMENT_SECTION_LABELS[section]}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Analyzing your notes and generating suggestions...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchSuggestions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : (
            <>
              {/* Questions to consider */}
              {questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    Questions to consider
                  </h3>
                  <div className="space-y-2">
                    {questions.map((question, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900"
                      >
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          {question}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {questions.length > 0 && suggestions.length > 0 && (
                <Separator />
              )}

              {/* Writing suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Suggested additions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click to add to the end of your section
                  </p>
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => {
                      const isAccepted = acceptedIds.has(suggestion.id);
                      return (
                        <div
                          key={suggestion.id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            isAccepted
                              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                              : "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                          )}
                          onClick={() => !isAccepted && handleAccept(suggestion)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              {suggestion.type === "reference" && suggestion.source && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  From: {suggestion.source}
                                </div>
                              )}
                              <p className="text-sm">{suggestion.content}</p>
                            </div>
                            {isAccepted ? (
                              <Badge
                                variant="secondary"
                                className="shrink-0 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Added
                              </Badge>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No suggestions state */}
              {!isLoading && questions.length === 0 && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Add more journal entries related to this section to get better suggestions.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>

        <div className="border-t p-4 flex justify-between items-center shrink-0">
          <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh suggestions
          </Button>
          <Button variant="default" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
