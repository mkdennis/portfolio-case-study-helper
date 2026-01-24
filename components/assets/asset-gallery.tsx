"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Upload } from "lucide-react";
import { format } from "date-fns";
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
  const [selectedAsset, setSelectedAsset] = useState<(AssetMetadata & { url: string }) | null>(
    null
  );

  if (assets.length === 0 && !showUpload) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Upload screenshots, diagrams, and other visuals for your case study.
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Assets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showUpload && (
        <UploadZone
          projectSlug={projectSlug}
          onComplete={() => {
            setShowUpload(false);
            // Refresh would happen via SWR revalidation in real implementation
            window.location.reload();
          }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowUpload(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Asset
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-2 sm:p-3">
              <p className="text-sm font-medium truncate">{asset.filename}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-xs">
                  {asset.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(asset.uploadedAt), "MMM d")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.filename}</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.altText || selectedAsset.filename}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{selectedAsset.role}</Badge>
                  {selectedAsset.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {selectedAsset.altText && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAsset.altText}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
