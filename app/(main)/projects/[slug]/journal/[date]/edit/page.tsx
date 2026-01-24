"use client";

import { useState, useCallback, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import { VoiceMicButton } from "@/components/ui/voice-mic-button";
import { toast } from "sonner";
import { ENTRY_TAGS, CASE_STUDY_SECTIONS, CASE_STUDY_SECTION_LABELS, type EntryTag, type CaseStudySection } from "@/types";
import type { JournalEntry } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string; date: string }>;
}) {
  const { slug, date } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tags, setTags] = useState<EntryTag[]>([]);
  const [section, setSection] = useState<CaseStudySection | "">("");
  const [text, setText] = useState("");
  const [existingAssets, setExistingAssets] = useState<string[]>([]);

  // Image state for new uploads
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch existing entry data
  useEffect(() => {
    async function fetchEntry() {
      try {
        const res = await fetch(`/api/journal/${date}?project=${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Journal entry not found");
            return;
          }
          throw new Error("Failed to fetch entry");
        }

        const data = await res.json();
        const entry: JournalEntry = data.entry;

        // Populate form with existing data
        setTags((entry.tags || []) as EntryTag[]);
        setSection(entry.section || "");
        setExistingAssets(entry.assets || []);

        // Handle both new format (text) and legacy format
        if (entry.content.text) {
          setText(entry.content.text);
        } else {
          // For legacy entries, combine the sections into text
          const legacyParts = [
            entry.content.decision && `Decision: ${entry.content.decision}`,
            entry.content.why && `Why: ${entry.content.why}`,
            entry.content.milestone && `Milestone: ${entry.content.milestone}`,
            entry.content.change && `What Changed: ${entry.content.change}`,
            entry.content.tradeoff && `Tradeoff: ${entry.content.tradeoff}`,
            entry.content.feedback && `Feedback: ${entry.content.feedback}`,
          ].filter(Boolean);
          setText(legacyParts.join("\n\n"));
        }
      } catch (err) {
        console.error("Error fetching entry:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch entry");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntry();
  }, [slug, date]);

  function toggleTag(tag: EntryTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function removeExistingAsset(asset: string) {
    setExistingAssets((prev) => prev.filter((a) => a !== asset));
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

  function removeNewImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  // Build image URLs for existing assets
  const getAssetUrl = (filename: string) => {
    return `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/main/projects/${slug}/assets/${filename}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Please write something in your journal entry");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedAssetFilename: string | undefined;

      // Upload new image if present
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

      // Combine existing assets with new upload
      const allAssets = [
        ...existingAssets,
        ...(uploadedAssetFilename ? [uploadedAssetFilename] : []),
      ];

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
          assets: allAssets,
          section: section || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save entry");
      }

      toast.success("Journal entry updated");
      router.push(`/projects/${slug}/journal/${date}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="container py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6 sm:mb-8" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  if (error) {
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
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/projects/${slug}/journal/${date}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Entry
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Edit Journal Entry</CardTitle>
            <CardDescription>
              Update your journal entry for {date}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  disabled
                  className="w-full sm:w-48 bg-muted"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {ENTRY_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer py-2 px-3 text-sm"
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
                <Label htmlFor="section">Case Study Section (optional)</Label>
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
                <p className="text-sm text-muted-foreground">
                  Link this entry to a case study section for organized presentation.
                </p>
              </div>

              {/* Journal Entry */}
              <div className="space-y-2">
                <Label htmlFor="text">Journal Entry</Label>
                <div className="relative">
                  <Textarea
                    id="text"
                    placeholder="What happened today? Decisions made, milestones hit, challenges faced..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-40 pb-14"
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

              {/* Existing Assets */}
              {existingAssets.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Images</Label>
                  <div className="space-y-3">
                    {existingAssets.map((asset) => {
                      const isImage = /\.(png|jpg|jpeg|gif)$/i.test(asset);
                      return (
                        <div key={asset} className="border rounded-lg p-4">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getAssetUrl(asset)}
                                  alt={asset}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm sm:text-base">{asset}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExistingAsset(asset)}
                                className="mt-2 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="space-y-2">
                <Label>Add New Image (optional)</Label>
                {!imageFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="hidden sm:inline">Drag and drop an image, or click to select</span>
                      <span className="sm:hidden">Tap to select an image</span>
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
                  <div className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{imageFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(imageFile.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeNewImage}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit - stack buttons on mobile */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                <Link href={`/projects/${slug}/journal/${date}`} className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
