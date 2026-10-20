"use client";

import React, { useState, useRef, useId, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateStory, useUpdateStory } from "@/lib/hooks/queries/useStoryQuery";
import { useCategories } from "@/lib/hooks/queries/useCategoryQuery";
import { useTags } from "@/lib/hooks/queries/useTagQuery";
import {
  CreateStoryPayload,
  StoryAgeRating,
  StoryItem,
  StoryProgressState,
  StoryVisibility,
} from "@/types/story";
import { uploadService } from "@/lib/services/upload.service";
import { toast } from "@/lib/toast";
import { GenrePickerModal } from "./GenrePickerModal";
import { TagPickerModal } from "./TagPickerModal";
import { ImageCropperModal } from "./ImageCropperModal";

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

  // Progress state
  const [progressState, setProgressState] = useState<StoryProgressState>(
    initialStory?.progressState || "ONGOING"
  );

  // Genres state
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

  // Tags state
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

  // Cover image: hỗ trợ tải tệp từ máy hoặc dán link URL trực tiếp
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

  // Fetch categories & tags from API via hooks
  const { data: categoriesData } = useCategories({ all: true });
  const { data: tagsData } = useTags({ all: true });

  const apiCategories = categoriesData?.items || [];
  const apiTags = tagsData?.items || [];

  // Đồng bộ thể loại và thẻ tag từ initialStory khi dữ liệu truyện hoặc API tải xong
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
        if (names.length > 0) {
          setSelectedGenres(names);
        }
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
        if (names.length > 0) {
          setSelectedTags(names);
        }
      }
    }
  }, [initialStory, apiCategories, apiTags]);

  // Slug generator
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

  // Cover File Selection Handler
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

    // Kiểm tra tỉ lệ ảnh: chuẩn là 2:3 (0.6667)
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const targetRatio = 2 / 3;
      // Nếu tỉ lệ lệch quá 4%, tự động mở modal crop cho tác giả căn chỉnh
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

  // Genre confirm from modal
  const handleConfirmGenres = (genres: string[]) => {
    setSelectedGenres(genres);
  };

  const handleRemoveGenre = (genreName: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genreName));
  };

  // Tag toggle / remove
  const handleRemoveTag = (tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName));
  };

  // Submit Handler (DRAFT or SUBMIT)
  const handleSubmit = async (action: "DRAFT" | "SUBMIT") => {
    if (!title.trim() || title.trim().length < 2) {
      toast.error("Tên tác phẩm phải từ 2 ký tự trở lên");
      return;
    }

    setIsSubmitting(true);
    let finalCoverUrl = "";

    // 1. Upload ảnh khi bấm Action nếu chọn từ tệp trong máy
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
      // Nhập trực tiếp đường dẫn URL hoặc giữ nguyên ảnh đã có
      finalCoverUrl = previewUrl.trim();
    }

    // 2. Map thể loại sang Mongo ObjectIds nếu có trong API categories
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

    // 3. Map tags sang Mongo ObjectIds nếu có trong API tags
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

    // 4. Payload gửi API
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

    // 5. Gửi lên server qua mutation hook
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
          {/* Box 1: Thông tin cơ bản */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
              Thông tin tác phẩm
            </h2>

            {/* Tên truyện & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Tên tác phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="VD: Vạn Cổ Đệ Nhất Thần"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Đường dẫn (Slug URL)
                </label>
                <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-3 focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500">
                  <span className="text-sm text-zinc-400 font-mono select-none">/truyen/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="van-co-de-nhat-than"
                    className="w-full py-2.5 pl-1.5 pr-2 bg-transparent text-sm text-zinc-900 font-mono focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tóm tắt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-zinc-800">
                  Tóm tắt cốt truyện
                </label>
                <span className="text-xs text-zinc-400 font-medium">{description.length} ký tự</span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu nội dung, bối cảnh và điểm hấp dẫn của tác phẩm..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 resize-none leading-relaxed"
              />
            </div>

            {/* Tiến độ sáng tác & Độ tuổi độc giả */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Tình trạng tiến độ
                </label>
                <select
                  value={progressState}
                  onChange={(e) => setProgressState(e.target.value as StoryProgressState)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
                >
                  <option value="ONGOING">Đang ra (Đang cập nhật chương)</option>
                  <option value="COMPLETED">Đã hoàn thành (Trọn bộ)</option>
                  <option value="ON_HOLD">Tạm ngưng ra chương</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                  Độ tuổi độc giả
                </label>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value as StoryAgeRating)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">Mọi lứa tuổi (ALL)</option>
                  <option value="13+">13+ (Thiếu niên)</option>
                  <option value="16+">16+ (Trưởng thành nhẹ)</option>
                  <option value="18+">18+ (Cảnh báo nhạy cảm)</option>
                </select>
              </div>
            </div>

            {/* Lời ngỏ tác giả / Lịch ra chương */}
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Lời ngỏ tác giả / Lịch ra chương
              </label>
              <input
                type="text"
                value={authorNote}
                onChange={(e) => setAuthorNote(e.target.value)}
                placeholder="VD: Cố định 2 chương/ngày lúc 20:00..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Box 2: Thể loại & Thẻ Tag (Có Modal chọn đầy đủ) */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
              Thể loại & Thẻ Tag
            </h2>

            {/* Thể loại */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-zinc-800">
                  Thể loại ({selectedGenres.length})
                </label>
                <button
                  type="button"
                  onClick={() => setGenreModalOpen(true)}
                  className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Chọn thể loại</span>
                </button>
              </div>

              <div className="min-h-[46px] p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center gap-1.5">
                {selectedGenres.length > 0 ? (
                  selectedGenres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-800 font-medium"
                    >
                      <span>{genre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGenre(genre)}
                        className="text-zinc-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span
                    onClick={() => setGenreModalOpen(true)}
                    className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-600 px-1"
                  >
                    Bấm vào đây để chọn thể loại cho tác phẩm...
                  </span>
                )}
              </div>
            </div>

            {/* Thẻ Tag */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-zinc-800">
                  Thẻ Tag ({selectedTags.length})
                </label>
                <button
                  type="button"
                  onClick={() => setTagModalOpen(true)}
                  className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Chọn thẻ tag</span>
                </button>
              </div>

              <div className="min-h-[46px] p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center gap-1.5">
                {selectedTags.length > 0 ? (
                  selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-700 font-medium"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span
                    onClick={() => setTagModalOpen(true)}
                    className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-600 px-1"
                  >
                    Bấm vào đây để chọn các thẻ tag cho tác phẩm...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: ẢNH BÌA & XUẤT BẢN (1 col) */}
        <div className="space-y-6">
          {/* Box 3: Ảnh bìa tác phẩm */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900">
                Ảnh bìa tác phẩm
              </h2>
              {/* Tab chuyển đổi chế độ nạp ảnh */}
              <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCoverSourceType("file")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    coverSourceType === "file"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Tải từ máy
                </button>
                <button
                  type="button"
                  onClick={() => setCoverSourceType("url")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    coverSourceType === "url"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Dán link URL
                </button>
              </div>
            </div>

            {/* Preview Box - Chuẩn tỉ lệ 2:3 */}
            <div className="w-full max-w-[200px] mx-auto aspect-[2/3] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center relative shadow-2xs group">
              {previewUrl && !imageLoadError ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Ảnh bìa xem trước"
                    className="w-full h-full object-cover"
                    onError={() => setImageLoadError(true)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setRawImageSrcToCrop(previewUrl);
                          setCropperOpen(true);
                        }}
                        className="px-3 py-1.5 bg-white/95 text-zinc-900 rounded-md text-xs font-semibold shadow-md hover:bg-white transition cursor-pointer pointer-events-auto flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M7 7l10 10" />
                        </svg>
                        <span>Cắt ảnh</span>
                      </button>
                    )}
                  </div>
                </>
              ) : imageLoadError ? (
                <div className="p-3 text-center text-red-500 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs font-semibold">Link ảnh không hợp lệ</span>
                  <span className="text-2xs text-zinc-400 mt-1">Không tải được hình từ URL đã nhập</span>
                </div>
              ) : (
                <div className="p-3 text-center text-zinc-400 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 mb-2 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-zinc-600">Chưa có ảnh bìa</span>
                  <span className="text-xs text-zinc-400 mt-0.5">Tỉ lệ chuẩn 2:3 (VD: 600×900)</span>
                </div>
              )}
            </div>

            {/* Chế độ 1: Tải tệp từ máy */}
            {coverSourceType === "file" && (
              <div className="space-y-2.5">
                <input
                  ref={fileInputRef}
                  id={coverInputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer text-center"
                  >
                    {selectedFile ? "Thay đổi tệp" : "Chọn ảnh từ máy"}
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawImageSrcToCrop(previewUrl);
                        setCropperOpen(true);
                      }}
                      title="Cắt ảnh theo chuẩn 2:3"
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0M7 7l10 10" />
                      </svg>
                      <span>Cắt ảnh</span>
                    </button>
                  )}

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer"
                    >
                      Gỡ
                    </button>
                  )}
                </div>

                {selectedFile && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <span>✓</span>
                    <span>Đã chọn: {selectedFile.name} (chỉ upload khi bấm lưu)</span>
                  </p>
                )}

                <p className="text-xs text-zinc-500 leading-relaxed">
                  Hỗ trợ JPG, PNG, WEBP tối đa 5MB. Ảnh sẽ tự động tải lên khi bạn nhấn Lưu / Gửi duyệt.
                </p>
              </div>
            )}

            {/* Chế độ 2: Dán liên kết URL ảnh */}
            {coverSourceType === "url" && (
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Đường dẫn ảnh trực tiếp (URL)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      placeholder="https://example.com/anh-bia.jpg"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 pr-14"
                    />
                    {imageUrlInput && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-red-500 font-medium px-1.5 py-0.5 rounded cursor-pointer transition"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                {previewUrl && !selectedFile && !imageLoadError && (
                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span>✓</span> Đang sử dụng liên kết ảnh
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                )}

                <p className="text-xs text-zinc-500 leading-relaxed">
                  Nhập liên kết hình ảnh công khai trên internet. Ảnh sẽ được hiển thị trực tiếp mà không cần tải lên máy chủ.
                </p>
              </div>
            )}
          </div>

          {/* Box 4: Chế độ hiển thị & Nút hành động */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
              Chế độ hiển thị
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  visibility === "PUBLIC"
                    ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="text-sm font-bold text-zinc-900">Công khai</div>
                <div className="text-xs text-zinc-500 mt-0.5">Hiển thị cho độc giả</div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  visibility === "PRIVATE"
                    ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="text-sm font-bold text-zinc-900">Riêng tư</div>
                <div className="text-xs text-zinc-500 mt-0.5">Chỉ bạn xem được</div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <button
                type="button"
                disabled={isSubmitting || createStoryMutation.isPending || updateStoryMutation.isPending}
                onClick={() => handleSubmit("SUBMIT")}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting || createStoryMutation.isPending || updateStoryMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isUploadingImage ? "Đang tải ảnh..." : "Đang xử lý..."}</span>
                  </>
                ) : (
                  <span>Gửi xét duyệt tác phẩm</span>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting || createStoryMutation.isPending || updateStoryMutation.isPending}
                onClick={() => handleSubmit("DRAFT")}
                className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Lưu bản nháp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chọn thể loại */}
      <GenrePickerModal
        isOpen={genreModalOpen}
        onClose={() => setGenreModalOpen(false)}
        availableGenres={apiCategories}
        selectedGenres={selectedGenres}
        onConfirm={handleConfirmGenres}
      />

      {/* Modal chọn thẻ tag */}
      <TagPickerModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        availableTags={apiTags}
        selectedTags={selectedTags}
        onConfirm={(tags) => setSelectedTags(tags)}
      />

      {/* Modal cắt ảnh chuẩn 2:3 */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageSrcToCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
