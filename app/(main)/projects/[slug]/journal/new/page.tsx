"use client";

import { useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
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
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">New Journal Entry</CardTitle>
            <CardDescription>
              Document today&apos;s design decisions, milestones, and insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image (optional)</Label>
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
                          onClick={removeImage}
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
                <Link href={`/projects/${slug}`} className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
