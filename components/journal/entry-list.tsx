"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Calendar, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { JournalEntry } from "@/types";

interface JournalEntryListProps {
  entries: JournalEntry[];
  projectSlug: string;
}

export function JournalEntryList({
  entries,
  projectSlug,
}: JournalEntryListProps) {
  const router = useRouter();
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteEntry) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/journal/${deleteEntry.date}?project=${projectSlug}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }

      toast.success("Entry deleted");
      setDeleteEntry(null);
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold mb-1">No journal entries yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Start documenting your design decisions.
          </p>
          <Link href={`/projects/${projectSlug}/journal/new`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Add First Entry
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative pl-6">
        {/* Timeline spine - starts at first dot, no hanging line */}
        <div className="absolute left-[5px] top-[22px] bottom-2 w-0.5 bg-border" />

        {/* Entries */}
        <div>
          {entries.map((entry, index) => {
            const previewText =
              entry.content.text ||
              entry.content.decision ||
              entry.content.milestone ||
              entry.content.tradeoff ||
              "";

            return (
              <div key={entry.date} className="relative group">
                {/* Timeline dot - aligned with date line */}
                <div className="absolute -left-6 top-[22px] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                </div>

                {/* Entry content */}
                <div className="flex items-center gap-2 py-4">
                  <Link
                    href={`/projects/${projectSlug}/journal/${entry.date}`}
                    className="flex-1 min-w-0 hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">
                        {format(new Date(entry.date), "MMM d")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "EEEE")}
                      </span>
                      {entry.assets.length > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          {entry.assets.length}
                        </span>
                      )}
                    </div>
                    {previewText && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {previewText}
                      </p>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5 font-normal">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteEntry(entry);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Divider */}
                {index < entries.length - 1 && (
                  <div className="border-b border-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogDescription>
              This will permanently delete the journal entry from{" "}
              {deleteEntry && format(new Date(deleteEntry.date), "MMMM d, yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
