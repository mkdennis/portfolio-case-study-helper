"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Plus, FolderOpen, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { ProjectMetadata } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch projects");
        }

        setProjects(data.projects || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch projects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-muted-foreground text-sm">
                Check that GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are set in .env.local
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Your design case studies and journal entries
            </p>
          </div>
          <Link href="/dashboard/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground text-center mb-4">
                Create your first project to start journaling your design work.
              </p>
              <Link href="/dashboard/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge
                        variant={
                          project.timeframe.status === "completed"
                            ? "secondary"
                            : project.timeframe.status === "paused"
                            ? "outline"
                            : "default"
                        }
                      >
                        {project.timeframe.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.problemSpace}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(project.timeframe.start), "MMM yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated {format(new Date(project.updatedAt), "MMM d")}
                      </span>
                    </div>
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
