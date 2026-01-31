"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Upload, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UploadZone } from "./upload-zone";
import type { AssetMetadata } from "@/types";

interface AssetGalleryProps {
  assets: Array<AssetMetadata & { url: string }>;
  projectSlug: string;
}

export function AssetGallery({
  assets,
  projectSlug,
}: AssetGalleryProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<(AssetMetadata & { url: string }) | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<(AssetMetadata & { url: string }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteAsset) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/assets?project=${projectSlug}&filename=${encodeURIComponent(deleteAsset.filename)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete asset");
      }

      toast.success("Asset deleted");
      setDeleteAsset(null);
      setSelectedAsset(null);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    } finally {
      setIsDeleting(false);
    }
  }

  if (assets.length === 0 && !showUpload) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold mb-1">No assets yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Upload screenshots and visuals for your case study.
          </p>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload Assets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {showUpload && (
        <UploadZone
          projectSlug={projectSlug}
          onComplete={() => {
            setShowUpload(false);
            window.location.reload();
          }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="grid gap-2 grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {assets.map((asset) => (
          <Card
            key={asset.filename}
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
            onClick={() => setSelectedAsset(asset)}
          >
            <div className="aspect-video relative bg-muted">
              {asset.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.url}
                  alt={asset.altText || asset.filename}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{asset.suggestedName || asset.filename}</p>
              <span className="text-xs text-muted-foreground">
                {format(new Date(asset.uploadedAt), "MMM d")}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedAsset?.suggestedName || selectedAsset?.filename}</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-3">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.altText || selectedAsset.filename}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{selectedAsset.role}</Badge>
                  {selectedAsset.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteAsset(selectedAsset)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </div>
              {selectedAsset.altText && (
                <p className="text-sm text-muted-foreground">
                  {selectedAsset.altText}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete asset?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{deleteAsset?.suggestedName || deleteAsset?.filename}&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAsset(null)}>
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
    </div>
  );
}
