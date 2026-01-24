"use client";

import { type ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CaseStudyLayoutProps {
  children: [ReactNode, ReactNode];
}

export function CaseStudyLayout({ children }: CaseStudyLayoutProps) {
  const [timeline, preview] = children;
  const [activePanel, setActivePanel] = useState<"timeline" | "preview">("timeline");

  return (
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 min-h-0">
      {/* Mobile tab switcher */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg lg:hidden">
        <button
          onClick={() => setActivePanel("timeline")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors",
            activePanel === "timeline"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Select Items
        </button>
        <button
          onClick={() => setActivePanel("preview")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors",
            activePanel === "preview"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Preview
        </button>
      </div>

      {/* Timeline panel */}
      <Card
        className={cn(
          "flex flex-col overflow-hidden min-h-[60vh] lg:min-h-0",
          activePanel !== "timeline" && "hidden lg:flex"
        )}
      >
        {timeline}
      </Card>

      {/* Preview panel */}
      <Card
        className={cn(
          "flex flex-col overflow-hidden min-h-[60vh] lg:min-h-0",
          activePanel !== "preview" && "hidden lg:flex"
        )}
      >
        {preview}
      </Card>
    </div>
  );
}
