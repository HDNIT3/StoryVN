"use client";

import React, { useState, useRef, useId, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateStory, useUpdateStory } from "@/features/stories";
import { useAllCategories } from "@/features/categories";
import { useTags } from "@/features/tags";
import {
  CreateStoryPayload,
  StoryAgeRating,
  StoryItem,
  StoryProgressState,
  StoryVisibility,
} from "@/features/stories";
import { uploadService } from "@/features/upload";
import { toast } from "@/lib/toast";
import { GenrePickerModal } from "./GenrePickerModal";
import { TagPickerModal } from "./TagPickerModal";
import { ImageCropperModal } from "./ImageCropperModal";
import { StoryBasicInfoFields } from "./StoryBasicInfoFields";
import { StoryGenresAndTagsFields } from "./StoryGenresAndTagsFields";
import { StoryCoverUploader } from "./StoryCoverUploader";
import { StoryPublishSettings } from "./StoryPublishSettings";

interface StoryStepFormProps {
  isEdit?: boolean;
  initialStory?: StoryItem | null;
}

export function StoryStepForm({ isEdit = false, initialStory }: StoryStepFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputId = useId();

  const createStoryMutation = useCreateStory();
  const updateStoryMutation = useUpdateStory();

  const storyId = initialStory?._id || initialStory?.id;

  // Basic fields
  const [title, setTitle] = useState(initialStory?.title || "");
  const [slug, setSlug] = useState(initialStory?.slug || "");
  const [description, setDescription] = useState(initialStory?.description || "");
  const [ageRating, setAgeRating] = useState<StoryAgeRating>(
    initialStory?.ageRating || "ALL"
  );
  const [visibility, setVisibility] = useState<StoryVisibility>(
    initialStory?.visibility || "PUBLIC"
  );
  const [authorNote, setAuthorNote] = useState(initialStory?.authorNote || "");
  const [progressState, setProgressState] = useState<StoryProgressState>(
    initialStory?.progressState || "ONGOING"
  );

  // Genres & Tags
  const rawInitialGenres = useMemo(() => {
    if (initialStory?.genreIds && initialStory.genreIds.length > 0) {
      return initialStory.genreIds.map((g: any) =>
        typeof g === "object" && g !== null ? g.name : g
      );
    }
    return initialStory?.genres || [];
  }, [initialStory]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>(rawInitialGenres);
  const [genreModalOpen, setGenreModalOpen] = useState(false);

  const rawInitialTags = useMemo(() => {
    if (initialStory?.tagIds && initialStory.tagIds.length > 0) {
      return initialStory.tagIds.map((t: any) =>
        typeof t === "object" && t !== null ? t.name : t
      );
    }
    return initialStory?.tags || [];
  }, [initialStory]);

  const [selectedTags, setSelectedTags] = useState<string[]>(rawInitialTags);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Cover image
  const [coverSourceType, setCoverSourceType] = useState<"file" | "url">(
    initialStory?.coverUrl ? "url" : "file"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialStory?.coverUrl || "");
  const [imageUrlInput, setImageUrlInput] = useState<string>(initialStory?.coverUrl || "");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrcToCrop, setRawImageSrcToCrop] = useState<string>("");

  // Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Categories & Tags
  const { data: apiCategories = [] } = useAllCategories();
  const { data: tagsData } = useTags({ all: true });
  const apiTags = tagsData?.items || [];

  useEffect(() => {
    if (initialStory) {
      if (initialStory.progressState) setProgressState(initialStory.progressState);

      if (initialStory.genreIds && initialStory.genreIds.length > 0) {
        const names = initialStory.genreIds
          .map((g: any) => {
            if (typeof g === "object" && g !== null && g.name) return g.name;
            const matched = apiCategories.find(
              (c: any) => c._id === g || c.name === g
            );
            return matched ? matched.name : typeof g === "string" ? g : "";
          })
          .filter(Boolean);
        if (names.length > 0) setSelectedGenres(names);
      }

      if (initialStory.tagIds && initialStory.tagIds.length > 0) {
        const names = initialStory.tagIds
          .map((t: any) => {
            if (typeof t === "object" && t !== null && t.name) return t.name;
            const matched = apiTags.find(
              (tag: any) => tag._id === t || tag.name === t
            );
            return matched ? matched.name : typeof t === "string" ? t : "";
          })
          .filter(Boolean);
        if (names.length > 0) setSelectedTags(names);
      }
    }
  }, [initialStory, apiCategories, apiTags]);

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) {
      setSlug(generateSlug(val));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP, GIF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file ảnh không được vượt quá 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageLoadError(false);
    setImageUrlInput("");

    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const targetRatio = 2 / 3;
      if (Math.abs(ratio - targetRatio) > 0.04) {
        setRawImageSrcToCrop(objectUrl);
        setCropperOpen(true);
      } else {
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
      }
    };
    img.onerror = () => {
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setSelectedFile(croppedFile);
    setPreviewUrl(croppedUrl);
    setImageLoadError(false);
    setCropperOpen(false);
    toast.success("Đã căn chỉnh ảnh bìa theo chuẩn tỉ lệ 2:3!");
  };

  const handleUrlInputChange = (val: string) => {
    setImageUrlInput(val);
    setImageLoadError(false);
    setSelectedFile(null);
    setPreviewUrl(val.trim());
  };

  const handleRemoveCover = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setImageUrlInput("");
    setImageLoadError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (action: "DRAFT" | "SUBMIT") => {
    if (!title.trim() || title.trim().length < 2) {
      toast.error("Tên tác phẩm phải từ 2 ký tự trở lên");
      return;
    }

    setIsSubmitting(true);
    let finalCoverUrl = "";

    if (selectedFile) {
      try {
        setIsUploadingImage(true);
        const uploadRes = await uploadService.uploadImage(selectedFile, "covers");
        finalCoverUrl = uploadRes.data?.url || (uploadRes as any).url || "";
      } catch (err: any) {
        setIsSubmitting(false);
        setIsUploadingImage(false);
        toast.error(err.message || "Tải ảnh bìa thất bại, vui lòng thử lại");
        return;
      } finally {
        setIsUploadingImage(false);
      }
    } else if (previewUrl?.trim()) {
      finalCoverUrl = previewUrl.trim();
    }

    const resolvedGenreIds: string[] = [];
    selectedGenres.forEach((name) => {
      const matched = apiCategories.find(
        (c: any) =>
          c._id === name ||
          c.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (matched && matched._id) {
        resolvedGenreIds.push(matched._id);
      }
    });

    const resolvedTagIds: string[] = [];
    selectedTags.forEach((name) => {
      const matched = apiTags.find(
        (t: any) =>
          t._id === name ||
          t.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (matched && matched._id) {
        resolvedTagIds.push(matched._id);
      }
    });

    const payload: CreateStoryPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      coverImage: finalCoverUrl || undefined,
      genreIds: resolvedGenreIds.length > 0 ? resolvedGenreIds : undefined,
      tagIds: resolvedTagIds.length > 0 ? resolvedTagIds : undefined,
      ageRating,
      visibility,
      authorNote: authorNote.trim() || undefined,
      progressState,
    };

    try {
      if (isEdit) {
        const identifier = initialStory?.slug || storyId;
        if (identifier) {
          await updateStoryMutation.mutateAsync({ id: identifier, payload, action });
        }
      } else {
        await createStoryMutation.mutateAsync({ payload, action });
      }
      router.push("/tac-gia/tac-pham");
    } catch {
      // toast notification is handled by mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {isEdit ? "Chỉnh sửa tác phẩm" : "Khởi tạo tác phẩm mới"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEdit
              ? `Tác phẩm: ${title || "..."}`
              : "Điền thông tin và đăng ký xuất bản tác phẩm"}
          </p>
        </div>

        <Link
          href="/tac-gia/tac-pham"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Quay lại</span>
        </Link>
      </div>

      {/* Main 2-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* CỘT TRÁI: THÔNG TIN TÁC PHẨM (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <StoryBasicInfoFields
            title={title}
            slug={slug}
            description={description}
            progressState={progressState}
            ageRating={ageRating}
            authorNote={authorNote}
            onTitleChange={handleTitleChange}
            onSlugChange={setSlug}
            onDescriptionChange={setDescription}
            onProgressStateChange={setProgressState}
            onAgeRatingChange={setAgeRating}
            onAuthorNoteChange={setAuthorNote}
          />

          <StoryGenresAndTagsFields
            selectedGenres={selectedGenres}
            selectedTags={selectedTags}
            onOpenGenreModal={() => setGenreModalOpen(true)}
            onOpenTagModal={() => setTagModalOpen(true)}
            onRemoveGenre={(genre) => setSelectedGenres((prev) => prev.filter((g) => g !== genre))}
            onRemoveTag={(tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
          />
        </div>

        {/* CỘT PHẢI: ẢNH BÌA & XUẤT BẢN (1 col) */}
        <div className="space-y-6">
          <StoryCoverUploader
            coverSourceType={coverSourceType}
            previewUrl={previewUrl}
            imageUrlInput={imageUrlInput}
            selectedFile={selectedFile}
            imageLoadError={imageLoadError}
            coverInputId={coverInputId}
            fileInputRef={fileInputRef}
            onCoverSourceTypeChange={setCoverSourceType}
            onFileChange={handleFileChange}
            onUrlInputChange={handleUrlInputChange}
            onRemoveCover={handleRemoveCover}
            onOpenCropper={() => {
              setRawImageSrcToCrop(previewUrl);
              setCropperOpen(true);
            }}
            setImageLoadError={setImageLoadError}
          />

          <StoryPublishSettings
            visibility={visibility}
            isSubmitting={isSubmitting}
            isUploadingImage={isUploadingImage}
            isPendingMutation={createStoryMutation.isPending || updateStoryMutation.isPending}
            onVisibilityChange={setVisibility}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Modals */}
      <GenrePickerModal
        isOpen={genreModalOpen}
        onClose={() => setGenreModalOpen(false)}
        availableGenres={apiCategories}
        selectedGenres={selectedGenres}
        onConfirm={setSelectedGenres}
      />

      <TagPickerModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        availableTags={apiTags}
        selectedTags={selectedTags}
        onConfirm={setSelectedTags}
      />

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageSrcToCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
