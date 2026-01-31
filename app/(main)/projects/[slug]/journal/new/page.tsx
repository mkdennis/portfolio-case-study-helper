"use client";

import { useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, X, Upload, Image as ImageIcon, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { VoiceMicButton } from "@/components/ui/voice-mic-button";
import { toast } from "sonner";
import { ENTRY_TAGS, CASE_STUDY_SECTIONS, CASE_STUDY_SECTION_LABELS, type EntryTag, type CaseStudySection } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewJournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Get initial section from URL params if valid
  const initialSection = searchParams.get("section");
  const validInitialSection = initialSection && CASE_STUDY_SECTIONS.includes(initialSection as CaseStudySection)
    ? (initialSection as CaseStudySection)
    : "";

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState<EntryTag[]>([]);
  const [section, setSection] = useState<CaseStudySection | "">(validInitialSection);
  const [text, setText] = useState("");

  // Auto-expand details if section is pre-selected from URL
  const hasPreselectedSection = Boolean(validInitialSection);

  // Image state
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function toggleTag(tag: EntryTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

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
      handleImageFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleImageFile(files[0]);
      }
    },
    []
  );

  function handleImageFile(file: File) {
    const allowedTypes = ["image/png", "image/jpeg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: PNG, JPG, GIF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Please write something in your journal entry");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedAssetFilename: string | undefined;

      // Upload image first if present
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("projectSlug", slug);
        formData.append("role", "other");

        const assetRes = await fetch("/api/assets", {
          method: "POST",
          body: formData,
        });

        const assetResult = await assetRes.json();

        if (!assetRes.ok) {
          throw new Error(assetResult.error || "Failed to upload image");
        }

        uploadedAssetFilename = assetResult.asset.filename;
      }

      // Save journal entry
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSlug: slug,
          date,
          tags,
          text,
          assets: uploadedAssetFilename ? [uploadedAssetFilename] : [],
          section: section || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save entry");
      }

      toast.success("Journal entry saved");
      router.push(`/projects/${slug}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Summary of optional details added
  const detailsSummary = [
    tags.length > 0 && `${tags.length} tag${tags.length > 1 ? "s" : ""}`,
    section && CASE_STUDY_SECTION_LABELS[section],
    imageFile && "1 image",
  ].filter(Boolean);

  return (
    <main className="container py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Journal Entry - NOW FIRST */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    id="text"
                    placeholder="What happened today? Decisions made, milestones hit, challenges faced..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-32 pb-14 text-base"
                    autoFocus
                  />
                  <div className="absolute bottom-3 right-3">
                    <VoiceMicButton
                      onTranscript={(transcript) => {
                        setText((prev) => {
                          const separator = prev.trim() ? " " : "";
                          return prev + separator + transcript;
                        });
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Collapsible Details Section */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {showDetails || hasPreselectedSection ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Add details
                    {detailsSummary.length > 0 && !showDetails && !hasPreselectedSection && (
                      <span className="text-xs text-muted-foreground">
                        ({detailsSummary.join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(date), "MMM d, yyyy")}
                  </span>
                </button>

                {(showDetails || hasPreselectedSection) && (
                  <div className="px-3 pb-3 space-y-4 border-t pt-3">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full sm:w-48"
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="text-sm">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {ENTRY_TAGS.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer py-1.5 px-2.5 text-xs"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                            {tags.includes(tag) && (
                              <X className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Case Study Section */}
                    <div className="space-y-2">
                      <Label htmlFor="section" className="text-sm">Case Study Section</Label>
                      <Select
                        value={section || "none"}
                        onValueChange={(value) => setSection(value === "none" ? "" : value as CaseStudySection)}
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Select a section..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {CASE_STUDY_SECTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {CASE_STUDY_SECTION_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm">Image</Label>
                      {!imageFile ? (
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                            isDragging
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/25 hover:border-muted-foreground/50"
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="hidden sm:inline">Drag and drop, or click to select</span>
                            <span className="sm:hidden">Tap to select</span>
                          </p>
                          <input
                            type="file"
                            id="image-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/gif"
                            onChange={handleFileInput}
                          />
                          <label htmlFor="image-upload">
                            <Button type="button" variant="secondary" size="sm" asChild>
                              <span>Select Image</span>
                            </Button>
                          </label>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {imagePreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{imageFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(imageFile.size / 1024).toFixed(1)} KB
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="mt-1 h-7 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Link href={`/projects/${slug}`} className="flex-1 sm:flex-none">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
