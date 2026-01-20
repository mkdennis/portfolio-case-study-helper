"use client";

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ASSET_ROLES } from "@/types";

interface UploadZoneProps {
  projectSlug: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function UploadZone({
  projectSlug,
  onComplete,
  onCancel,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [role, setRole] = useState<string>("other");
  const [altText, setAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    []
  );

  function handleFile(file: File) {
    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: PNG, JPG, GIF, PDF");
      return;
    }

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB");
      return;
    }

    setFile(file);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectSlug", projectSlug);
      formData.append("role", role);
      formData.append("altText", altText);

      const res = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to upload asset");
      }

      toast.success("Asset uploaded successfully");
      onComplete();
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload asset");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PNG, JPG, GIF, or PDF up to 10MB
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/png,image/jpeg,image/gif,application/pdf"
              onChange={handleFileInput}
            />
            <div className="flex justify-center gap-2">
              <label htmlFor="file-upload">
                <Button variant="secondary" asChild>
                  <span>Select File</span>
                </Button>
              </label>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{file.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Alt Text (optional)</Label>
                <Input
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
              <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
