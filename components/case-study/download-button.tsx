"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateFullHTMLDocument } from "@/lib/case-study-generator";

interface DownloadButtonProps {
  htmlContent: string;
  projectName: string;
  disabled?: boolean;
}

export function DownloadButton({
  htmlContent,
  projectName,
  disabled,
}: DownloadButtonProps) {
  const handleDownload = () => {
    const fullDocument = generateFullHTMLDocument(htmlContent, projectName);

    const blob = new Blob([fullDocument], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-case-study.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} disabled={disabled} size="sm">
      <Download className="h-4 w-4 mr-2" />
      Download HTML
    </Button>
  );
}
