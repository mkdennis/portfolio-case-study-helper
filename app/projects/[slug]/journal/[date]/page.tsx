"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { ArrowLeft, Calendar, Edit, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import type { JournalEntry } from "@/types";

export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string; date: string }>;
}) {
  const { slug, date } = use(params);
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/journal/${date}?project=${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            router.push(`/projects/${slug}`);
            return;
          }
          throw new Error("Failed to fetch entry");
        }

        const data = await res.json();
        setEntry(data.entry);
      } catch (err) {
        console.error("Error fetching entry:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch entry");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntry();
  }, [slug, date, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <p>Entry not found</p>
        </main>
      </div>
    );
  }

  const sections = [
    { key: "decision", label: "Decision", content: entry.content.decision },
    { key: "why", label: "Why", content: entry.content.why },
    { key: "milestone", label: "Milestone", content: entry.content.milestone },
    { key: "change", label: "What Changed", content: entry.content.change },
    { key: "tradeoff", label: "Tradeoff", content: entry.content.tradeoff },
    { key: "feedback", label: "Feedback", content: entry.content.feedback },
  ].filter((s) => s.content);

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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <Link href={`/projects/${slug}/journal/${date}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              </div>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section) => (
                <div key={section.key}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {section.label}
                  </h3>
                  <p className="whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}

              {entry.assets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Attached Assets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.assets.map((asset) => (
                      <Badge key={asset} variant="secondary" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {asset}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
