"use client";

import { useCaseStudy } from "./case-study-context";
import { DownloadButton } from "./download-button";
import { Card } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";
import type { ProjectMetadata } from "@/types";

interface HTMLPreviewProps {
  project: ProjectMetadata;
}

export function HTMLPreview({ project }: HTMLPreviewProps) {
  const { state, getTotalItemCount } = useCaseStudy();
  const { generatedHtml } = state;
  const totalItems = getTotalItemCount();

  // Show empty state when no HTML has been generated
  if (!generatedHtml) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-sm">Preview</h2>
          <DownloadButton
            htmlContent=""
            projectName={project.name}
            disabled
          />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {totalItems === 0 ? "No items selected" : "Ready to generate"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {totalItems === 0
              ? "Add artifacts to sections on the left, then click Generate to create your case study."
              : `You have ${totalItems} item${totalItems === 1 ? "" : "s"} selected. Click "Generate Case Study" to see the preview.`}
          </p>
          {totalItems > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Click Generate Case Study to preview</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-sm">Preview</h2>
        <DownloadButton htmlContent={generatedHtml} projectName={project.name} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card className="p-6">
          <div
            className="prose prose-sm max-w-none dark:prose-invert
              prose-headings:font-semibold
              prose-h1:text-2xl prose-h1:mb-2
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:my-2
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
              prose-img:rounded-lg prose-img:shadow-md
              prose-figure:my-4
              prose-figcaption:text-sm prose-figcaption:text-muted-foreground
              [&_.section]:mb-6 [&_.section]:pb-6 [&_.section]:border-b [&_.section]:border-border
              [&_.section:last-child]:border-b-0
              [&_.meta]:text-muted-foreground
              [&_.tag]:inline-block [&_.tag]:bg-muted [&_.tag]:px-2 [&_.tag]:py-0.5 [&_.tag]:rounded [&_.tag]:text-xs [&_.tag]:mr-1
              [&_.tags]:mt-2
              [&_.entry]:bg-muted/50 [&_.entry]:p-4 [&_.entry]:rounded-lg [&_.entry]:mb-4"
            dangerouslySetInnerHTML={{ __html: generatedHtml }}
          />
        </Card>
      </div>
    </div>
  );
}
