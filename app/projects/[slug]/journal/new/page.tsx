"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { JOURNAL_PROMPTS, ENTRY_TAGS, type EntryTag } from "@/types";

export default function NewJournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState<EntryTag[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});

  function toggleTag(tag: EntryTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check if at least one response is filled
    const hasContent = Object.values(responses).some((v) => v.trim());
    if (!hasContent) {
      toast.error("Please fill in at least one prompt");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSlug: slug,
          date,
          tags,
          ...responses,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save entry");
      }

      toast.success("Journal entry saved");
      router.push(`/projects/${slug}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/projects/${slug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>New Journal Entry</CardTitle>
              <CardDescription>
                Document today&apos;s design decisions, milestones, and insights.
                Fill in whichever prompts are relevant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-48"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENTRY_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {tags.includes(tag) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Prompts */}
                <div className="space-y-6">
                  {JOURNAL_PROMPTS.map((prompt) => (
                    <div key={prompt.key} className="space-y-2">
                      <Label htmlFor={prompt.key}>{prompt.label}</Label>
                      <Textarea
                        id={prompt.key}
                        placeholder={prompt.placeholder}
                        value={responses[prompt.key] || ""}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            [prompt.key]: e.target.value,
                          }))
                        }
                        className="min-h-24"
                      />
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Entry
                  </Button>
                  <Link href={`/projects/${slug}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
