"use client";

import { cn } from "@/lib/utils";

interface SegmentedProgressProps {
  value: number; // 0-100
  segments?: number;
  className?: string;
  label?: string;
}

export function SegmentedProgress({
  value,
  segments = 10,
  className,
  label,
}: SegmentedProgressProps) {
  const filledSegments = Math.round((value / 100) * segments);

  // Shagreen color - a grayish-green
  const shagreen = "oklch(0.45 0.05 160)";
  const shagreenLight = "oklch(0.92 0.02 160)";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium">{Math.round(value)}%</span>
        </div>
      )}
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < filledSegments ? shagreen : shagreenLight,
            }}
          />
        ))}
      </div>
    </div>
  );
}
