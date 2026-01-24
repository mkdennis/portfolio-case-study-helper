"use client";

import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { AssetMetadata } from "@/types";

interface SelectableAssetCardProps {
  asset: AssetMetadata & { url: string };
}

export function SelectableAssetCard({ asset }: SelectableAssetCardProps) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="h-4 w-4 text-chart-2 shrink-0" />
          <span className="text-sm font-medium truncate">{asset.filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {asset.role}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(asset.uploadedAt), "MMM d")}
          </span>
        </div>
      </div>
    </div>
  );
}
