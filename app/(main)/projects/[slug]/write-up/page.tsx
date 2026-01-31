"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WriteUpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing write-up
  useEffect(() => {
    async function loadWriteUp() {
      try {
        const res = await fetch(`/api/write-up?project=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content || "");
        }
      } catch (error) {
        console.error("Error loading write-up:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadWriteUp();
  }, [slug]);

  // Auto-save after 2 seconds of no typing
  const saveContent = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/write-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: slug, content }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving write-up:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [slug, content, hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveContent();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, saveContent]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleContentChange(value: string) {
    setContent(value);
    setHasUnsavedChanges(true);
  }

  async function handleManualSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/write-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: slug, content }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success("Saved");
    } catch (error) {
      console.error("Error saving write-up:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="container py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6 sm:py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {hasUnsavedChanges && !isSaving && (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          )}
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Case Study Write-Up</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Write your final case study narrative here. Your journal entries and assets are available in the project view for reference.
      </p>

      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing your case study...

You can structure it however you like. Some common sections:

# Overview
What was the project? What problem were you solving?

# My Role
What was your responsibility on the team?

# Process
How did you approach the problem? What methods did you use?

# Key Decisions
What important choices did you make and why?

# Results
What was the outcome? Any metrics or feedback?

# Learnings
What did you learn from this project?"
        className="min-h-[60vh] text-lg leading-relaxed border-0 shadow-none focus-visible:ring-0 resize-none p-0"
      />
    </main>
  );
}
