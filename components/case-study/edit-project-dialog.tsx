"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectMetadata } from "@/types";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetadata;
  onSave: (updates: Partial<ProjectMetadata>) => Promise<void>;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSave,
}: EditProjectDialogProps) {
  const [role, setRole] = useState(project.role);
  const [problemSpace, setProblemSpace] = useState(project.problemSpace);
  const [team, setTeam] = useState(project.constraints.team);
  const [startDate, setStartDate] = useState(project.timeframe.start);
  const [endDate, setEndDate] = useState(project.timeframe.end || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        role,
        problemSpace,
        constraints: {
          ...project.constraints,
          team,
        },
        timeframe: {
          ...project.timeframe,
          start: startDate,
          end: endDate || null,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Lead Product Designer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="problemSpace">Problem Space</Label>
            <Textarea
              id="problemSpace"
              value={problemSpace}
              onChange={(e) => setProblemSpace(e.target.value)}
              placeholder="Describe the challenge or problem this project addresses"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team">Team</Label>
            <Input
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g., 1 designer, 2 engineers, 1 PM"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Leave empty if ongoing"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
