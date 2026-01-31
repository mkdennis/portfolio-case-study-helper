"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cloud, Smartphone } from "lucide-react";
import {
  getConflicts,
  resolveWithLocal,
  resolveWithRemote,
} from "@/lib/offline/conflict";
import type { SyncConflict } from "@/lib/offline/types";

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  onResolved,
}: ConflictDialogProps) {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (open) {
      setConflicts(getConflicts());
      setCurrentIndex(0);
    }
  }, [open]);

  const currentConflict = conflicts[currentIndex];

  const handleKeepLocal = async () => {
    if (!currentConflict) return;
    setIsResolving(true);
    try {
      await resolveWithLocal(currentConflict.operationId);
      moveToNext();
    } finally {
      setIsResolving(false);
    }
  };

  const handleKeepRemote = async () => {
    if (!currentConflict) return;
    setIsResolving(true);
    try {
      await resolveWithRemote(currentConflict.operationId);
      moveToNext();
    } finally {
      setIsResolving(false);
    }
  };

  const moveToNext = () => {
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onOpenChange(false);
      onResolved?.();
    }
  };

  if (!currentConflict) {
    return null;
  }

  const entityLabel = getEntityLabel(currentConflict);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            {conflicts.length > 1 && (
              <span className="text-xs">
                Conflict {currentIndex + 1} of {conflicts.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentConflict.entityType}</Badge>
            <span className="text-sm font-medium">{entityLabel}</span>
          </div>

          <p className="text-sm text-muted-foreground">
            This {currentConflict.entityType} was modified both on this device
            and on another device. Choose which version to keep.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                This Device
              </div>
              <p className="text-xs text-muted-foreground">
                Your local changes that haven&apos;t been synced yet.
              </p>
              <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {formatPreview(currentConflict.localVersion)}
                </pre>
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cloud className="h-4 w-4" />
                Cloud
              </div>
              <p className="text-xs text-muted-foreground">
                Changes synced from another device.
              </p>
              <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {formatPreview(currentConflict.remoteVersion)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleKeepRemote}
            disabled={isResolving}
            className="w-full sm:w-auto"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Keep Cloud Version
          </Button>
          <Button
            onClick={handleKeepLocal}
            disabled={isResolving}
            className="w-full sm:w-auto"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Keep This Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getEntityLabel(conflict: SyncConflict): string {
  switch (conflict.entityType) {
    case "project":
      return conflict.entityId;
    case "journal":
      return `Entry from ${conflict.entityId}`;
    case "asset":
      return conflict.entityId;
    default:
      return conflict.entityId;
  }
}

function formatPreview(data: unknown): string {
  if (!data) return "(empty)";

  try {
    // Try to extract meaningful content
    const obj = data as Record<string, unknown>;

    // For journal entries, show text
    if (obj.text) {
      return String(obj.text).slice(0, 200);
    }

    // For projects, show name
    if (obj.name) {
      return `Name: ${obj.name}`;
    }

    // For nested objects, try to find content
    if (obj.entry) {
      const entry = obj.entry as Record<string, unknown>;
      if (entry.content) {
        const content = entry.content as Record<string, unknown>;
        return String(content.text || JSON.stringify(content)).slice(0, 200);
      }
    }

    if (obj.project) {
      const project = obj.project as Record<string, unknown>;
      return `Name: ${project.name}`;
    }

    // Fallback to JSON
    return JSON.stringify(data, null, 2).slice(0, 200);
  } catch {
    return "(unable to preview)";
  }
}
