"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedProgress } from "@/components/ui/segmented-progress";
import { WorkingSection, AIWritingAssistant } from "@/components/working-document";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  ProjectMetadata,
  JournalEntry,
  AssetMetadata,
  WorkingDocumentSection,
  WorkingDocumentSectionData,
  WorkingDocument,
} from "@/types";
import { WORKING_DOCUMENT_SECTIONS } from "@/types";

interface ProjectData {
  project: ProjectMetadata;
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
}

// Default word goal for the entire case study
const DEFAULT_WORD_GOAL = 2000;

function createEmptyDocument(projectId: string): WorkingDocument {
  const now = new Date().toISOString();
  const sections = {} as Record<WorkingDocumentSection, WorkingDocumentSectionData>;

  for (const section of WORKING_DOCUMENT_SECTIONS) {
    sections[section] = {
      content: "",
      updatedAt: now,
    };
  }

  return {
    projectId,
    sections,
    wordGoal: DEFAULT_WORD_GOAL,
    createdAt: now,
    updatedAt: now,
  };
}

function countTotalWords(document: WorkingDocument): number {
  return Object.values(document.sections).reduce((total, section) => {
    return total + section.content.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
}

// Map working document sections to case study sections for finding related entries
function getRelatedCaseStudySection(section: WorkingDocumentSection): string[] {
  const mapping: Record<WorkingDocumentSection, string[]> = {
    overview: ["all"],
    problem: ["all"],
    research: ["research"],
    process: ["process"],
    iterations: ["iterations"],
    results: ["final-results"],
    reflection: ["all"],
  };
  return mapping[section];
}

export default function WorkingCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [document, setDocument] = useState<WorkingDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<WorkingDocumentSection | null>(null);
  const [aiAssistantSection, setAiAssistantSection] = useState<WorkingDocumentSection | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load project data and working document
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch project data
        const projectRes = await fetch(`/api/projects/${slug}`);
        if (!projectRes.ok) {
          if (projectRes.status === 404) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch project");
        }
        const projectData = await projectRes.json();
        setProjectData(projectData);

        // Fetch or create working document
        const docRes = await fetch(`/api/working-document/${slug}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocument(docData);
        } else if (docRes.status === 404) {
          // Create empty document
          setDocument(createEmptyDocument(slug));
        } else {
          throw new Error("Failed to fetch working document");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug, router]);

  // Auto-save functionality
  const saveDocument = useCallback(async (doc: WorkingDocument) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/working-document/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setHasUnsavedChanges(false);
      toast.success("Saved");
    } catch (err) {
      console.error("Error saving document:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [slug]);

  // Debounced auto-save
  const scheduleAutoSave = useCallback((doc: WorkingDocument) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDocument(doc);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [saveDocument]);

  // Handle section content change
  const handleSectionChange = useCallback((section: WorkingDocumentSection, content: string) => {
    setDocument((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            content,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
      scheduleAutoSave(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [scheduleAutoSave]);

  // Handle accepting AI suggestion
  const handleAcceptSuggestion = useCallback((section: WorkingDocumentSection, text: string) => {
    setDocument((prev) => {
      if (!prev) return prev;
      const currentContent = prev.sections[section].content;
      const newContent = currentContent
        ? `${currentContent}\n\n${text}`
        : text;

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            content: newContent,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
      scheduleAutoSave(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [scheduleAutoSave]);

  // Get related entries for a section
  const getRelatedEntries = useCallback((section: WorkingDocumentSection): JournalEntry[] => {
    if (!projectData) return [];
    const caseSections = getRelatedCaseStudySection(section);
    return projectData.entries.filter((entry) => {
      if (caseSections.includes("all")) return true;
      return entry.section && caseSections.includes(entry.section);
    });
  }, [projectData]);

  // Get related assets for a section
  const getRelatedAssets = useCallback((section: WorkingDocumentSection): Array<AssetMetadata & { url: string }> => {
    if (!projectData) return [];
    const caseSections = getRelatedCaseStudySection(section);
    return projectData.assets.filter((asset) => {
      if (caseSections.includes("all")) return true;
      return asset.linkedSections.some((s) => caseSections.includes(s));
    });
  }, [projectData]);

  // Manual save
  const handleManualSave = () => {
    if (document) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      saveDocument(document);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Calculate progress
  const totalWords = document ? countTotalWords(document) : 0;
  const wordGoal = document?.wordGoal || DEFAULT_WORD_GOAL;
  const progress = Math.min(100, (totalWords / wordGoal) * 100);

  if (isLoading) {
    return (
      <main className="flex-1 container py-4 flex flex-col">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-8 w-full mb-6" />
        <div className="space-y-4">
          {WORKING_DOCUMENT_SECTIONS.map((s) => (
            <Skeleton key={s} className="h-24" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 container py-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!projectData || !document) {
    return (
      <main className="flex-1 container py-4">
        <p>Project not found</p>
      </main>
    );
  }

  const { project } = projectData;

  return (
    <main className="flex-1 container py-4 flex flex-col max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/projects/${slug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to {project.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
          </Button>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">Working Case Study</h1>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <SegmentedProgress
          value={progress}
          segments={10}
          label={`${totalWords.toLocaleString()} / ${wordGoal.toLocaleString()} words`}
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {WORKING_DOCUMENT_SECTIONS.map((section) => (
          <WorkingSection
            key={section}
            section={section}
            data={document.sections[section]}
            relatedEntries={getRelatedEntries(section)}
            relatedAssets={getRelatedAssets(section)}
            projectSlug={slug}
            onChange={(content) => handleSectionChange(section, content)}
            onHelpMeWrite={() => setAiAssistantSection(section)}
            isExpanded={expandedSection === section}
            onToggleExpand={() => {
              setExpandedSection(expandedSection === section ? null : section);
            }}
          />
        ))}
      </div>

      {/* AI Writing Assistant Modal */}
      {aiAssistantSection && (
        <AIWritingAssistant
          isOpen={!!aiAssistantSection}
          onClose={() => setAiAssistantSection(null)}
          section={aiAssistantSection}
          currentContent={document.sections[aiAssistantSection].content}
          relatedEntries={getRelatedEntries(aiAssistantSection)}
          relatedAssets={getRelatedAssets(aiAssistantSection)}
          projectName={project.name}
          problemSpace={project.problemSpace}
          onAcceptSuggestion={(text) => handleAcceptSuggestion(aiAssistantSection, text)}
        />
      )}
    </main>
  );
}
