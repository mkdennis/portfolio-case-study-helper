"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { AssetMetadata } from "@/types";

interface TimelineAssetCardProps {
  asset: AssetMetadata & { url: string };
  onClick?: () => void;
}

export function TimelineAssetCard({ asset, onClick }: TimelineAssetCardProps) {
  return (
    <Card
      className="hover:border-primary transition-colors cursor-pointer max-w-sm overflow-hidden"
      onClick={onClick}
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
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{asset.filename}</p>
        <div className="flex items-center justify-between mt-1">
          <Badge variant="outline" className="text-xs">
            {asset.role}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(asset.uploadedAt), "MMM d")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
