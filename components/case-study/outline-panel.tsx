"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCaseStudy } from "./case-study-context";
import { ArtifactPicker } from "./artifact-picker";
import type {
  CaseStudySection,
  JournalEntry,
  AssetMetadata,
  ProjectMetadata,
  TimelineItem,
} from "@/types";
import { CASE_STUDY_SECTIONS, CASE_STUDY_SECTION_LABELS } from "@/types";
import { EditProjectDialog } from "./edit-project-dialog";

function generateItemId(item: TimelineItem, index: number): string {
  return `${item.type}-${item.date}-${index}`;
}

interface OutlinePanelProps {
  entries: JournalEntry[];
  assets: Array<AssetMetadata & { url: string }>;
  project: ProjectMetadata;
}

interface OutlineSectionProps {
  section: CaseStudySection;
  items: TimelineItem[];
  onAddClick: () => void;
  onRemoveItem: (id: string) => void;
}

function OutlineSection({
  section,
  items,
  onAddClick,
  onRemoveItem,
}: OutlineSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isEmpty = items.length === 0;

  return (
    <Card className={cn(isEmpty && "opacity-60")}>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {CASE_STUDY_SECTION_LABELS[section]}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-3">
          {isEmpty ? (
            <p className="text-xs text-muted-foreground py-2">
              No items added yet. Click Add to select artifacts.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const id = `${item.type}-${item.date}-${index}`;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
                  >
                    {item.type === "journal" ? (
                      <>
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">
                            {format(new Date(item.date), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.data.content.text ||
                              item.data.content.decision ||
                              "Journal entry"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {item.data.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.data.role}
                          </p>
                        </div>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => onRemoveItem(id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function OutlinePanel({ entries, assets, project }: OutlinePanelProps) {
  const {
    getSectionItems,
    removeFromSection,
    generate,
    getTotalItemCount,
    state,
    addToSection,
  } = useCaseStudy();
  const [pickerSection, setPickerSection] = useState<CaseStudySection | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);
  const hasInitialized = useRef(false);

  // Auto-populate sections based on entry's section field
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Build timeline items from entries
    const journalItems: Array<{ item: TimelineItem; index: number }> = entries.map((entry, index) => ({
      item: {
        type: "journal" as const,
        date: entry.date,
        data: entry,
      },
      index,
    }));

    // Add entries to their designated sections
    for (const { item, index } of journalItems) {
      const entry = item.data as JournalEntry;
      if (entry.section && CASE_STUDY_SECTIONS.includes(entry.section as CaseStudySection)) {
        const id = generateItemId(item, index);
        addToSection(entry.section as CaseStudySection, id, item);
      }
    }
  }, [entries, addToSection]);

  const totalItems = getTotalItemCount();
  const hasGenerated = state.generatedHtml !== null;

  const handleGenerate = () => {
    generate(currentProject);
  };

  const handleSaveProject = async (updates: Partial<ProjectMetadata>) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to save project");
    const data = await res.json();
    setCurrentProject(data.project);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-sm">Case Study Outline</h2>
        <span className="text-xs text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"} selected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {CASE_STUDY_SECTIONS.map((section) => (
          <OutlineSection
            key={section}
            section={section}
            items={getSectionItems(section)}
            onAddClick={() => setPickerSection(section)}
            onRemoveItem={(id) => removeFromSection(section, id)}
          />
        ))}
      </div>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEditDialogOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit Project Details
        </Button>
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={totalItems === 0}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {hasGenerated ? "Regenerate Case Study" : "Generate Case Study"}
        </Button>
      </div>

      <ArtifactPicker
        open={pickerSection !== null}
        onOpenChange={(open) => !open && setPickerSection(null)}
        section={pickerSection}
        entries={entries}
        assets={assets}
      />

      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={currentProject}
        onSave={handleSaveProject}
      />
    </div>
  );
}
