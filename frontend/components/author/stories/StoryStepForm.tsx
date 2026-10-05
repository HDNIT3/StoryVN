"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";
import { StoryItem } from "@/types/story";
import { TagPickerModal } from "./TagPickerModal";

interface StoryStepFormProps {
  isEdit?: boolean;
  initialStory?: StoryItem | null;
}

export function StoryStepForm({ isEdit = false, initialStory }: StoryStepFormProps) {
  const router = useRouter();

  // Wizard Step (1: Thông tin, 2: Bìa & Tóm tắt, 3: Xuất bản, 4: Hoàn tất)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State - Step 1: Thông tin
  const [title, setTitle] = useState(initialStory?.title || "");
  const [slug, setSlug] = useState(initialStory?.slug || "");
  const [primaryGenre, setPrimaryGenre] = useState(
    initialStory?.genres?.[0] || "Tiên Hiệp"
  );
  const [subGenres, setSubGenres] = useState<string[]>(
    initialStory?.genres?.slice(1) || ["Huyền Huyễn"]
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialStory?.tags || ["Nhiệt Huyết", "Trọng Sinh"]
  );
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [ageLimit, setAgeLimit] = useState("ALL");

  // Form State - Step 2: Bìa & Tóm tắt
  const [coverUrl, setCoverUrl] = useState(initialStory?.coverUrl || "");
  const [description, setDescription] = useState(initialStory?.description || "");
  const [authorNote, setAuthorNote] = useState("");

  // Form State - Step 3: Xuất bản
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    initialStory?.visibility || "PUBLIC"
  );
  const [publishStatus, setPublishStatus] = useState<string>(
    initialStory?.status || "DRAFT"
  );
  const [agreedCopyright, setAgreedCopyright] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh mục thể loại
  const availableGenres = [
    "Tiên Hiệp",
    "Huyền Huyễn",
    "Khoa Huyễn",
    "Đô Thị",
    "Kiếm Hiệp",
    "Võng Du",
    "Trọng Sinh",
    "Hệ Thống",
    "Ngự Thú",
    "Xuyên Không",
    "Đồng Nhân",
    "Mạt Thế",
  ];

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

  const toggleSubGenre = (genre: string) => {
    if (genre === primaryGenre) return;
    if (subGenres.includes(genre)) {
      setSubGenres(subGenres.filter((g) => g !== genre));
    } else {
      if (subGenres.length < 3) {
        setSubGenres([...subGenres, genre]);
      } else {
        toast.info("Tối đa chọn thêm 3 thể loại phụ");
      }
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  // Step Navigations
  const handleNextStep1 = () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên tác phẩm");
      return;
    }
    if (!slug.trim()) {
      setSlug(generateSlug(title));
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (!description.trim() || description.trim().length < 15) {
      toast.error("Vui lòng nhập tóm tắt cốt truyện ít nhất 15 ký tự");
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = () => {
    if (!agreedCopyright) {
      toast.error("Vui lòng đánh dấu xác nhận cam kết bản quyền");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(4);
      toast.success(
        isEdit
          ? `Đã cập nhật tác phẩm "${title}" thành công!`
          : `Đã tạo tác phẩm "${title}" thành công!`
      );
    }, 500);
  };

  // Steps definition: vòng tròn ít chữ
  const steps = [
    { number: 1, label: "Thông tin" },
    { number: 2, label: "Bìa & Tóm tắt" },
    { number: 3, label: "Xuất bản" },
    { number: 4, label: "Hoàn tất" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-3 select-none">
        <Link href="/" className="hover:text-zinc-700 transition">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/tac-gia/tac-pham" className="hover:text-zinc-700 transition">
          Quản lý tác phẩm
        </Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium">
          {isEdit ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
        </span>
      </nav>

      {/* Top Header Row (Đã bỏ khung viền bao quanh) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Cột trái: Tiêu đề */}
        <div className="shrink-0 md:max-w-xs">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {isEdit ? "Chỉnh sửa tác phẩm" : "Khởi tạo tác phẩm"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {isEdit ? `${title || "..."}` : "Điền thông tin xuất bản"}
          </p>
        </div>

        {/* Cột giữa: Thanh các bước vòng tròn tinh gọn */}
        <div className="flex-1 max-w-sm mx-auto w-full px-2 select-none">
          <div className="relative flex items-center justify-between">
            {/* Đường line xám nền */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-zinc-200 -z-0" />
            {/* Đường line xanh chạy theo bước */}
            <div
              className="absolute left-4 top-4 h-0.5 bg-sky-500 transition-all duration-300 -z-0"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 92}%`,
              }}
            />

            {steps.map((step) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <div key={step.number} className="flex flex-col items-center relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEdit || isCompleted) setCurrentStep(step.number);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      isCurrent
                        ? "bg-sky-500 text-white ring-3 ring-sky-100 shadow-xs"
                        : isCompleted
                        ? "bg-emerald-500 text-white shadow-xs cursor-pointer"
                        : isEdit
                        ? "bg-white text-zinc-600 border border-zinc-300 hover:border-zinc-400 cursor-pointer"
                        : "bg-white text-zinc-400 border border-zinc-200 cursor-default"
                    }`}
                  >
                    {isCompleted ? "✓" : step.number}
                  </button>
                  <span
                    className={`text-[11px] mt-1.5 transition-colors whitespace-nowrap ${
                      isCurrent
                        ? "text-sky-600 font-semibold"
                        : isCompleted
                        ? "text-zinc-800 font-medium"
                        : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Nút quay lại */}
        <div className="shrink-0 flex justify-end">
          <Link
            href="/tac-gia/tac-pham"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại</span>
          </Link>
        </div>
      </div>

      {/* ─── CARD NỘI DUNG FORM (Bo góc vừa phải rounded-xl) ─── */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 sm:p-6">
        {/* BƯỚC 1: THÔNG TIN */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Tên truyện & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Tên tác phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="VD: Vạn Cổ Đệ Nhất Thần"
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Slug URL
                </label>
                <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-3 focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500">
                  <span className="text-xs text-zinc-400 font-mono select-none">/truyen/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="van-co-de-nhat-than"
                    className="w-full py-2 pl-1 pr-2 bg-transparent text-xs sm:text-sm text-zinc-900 font-mono focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Thể loại chính */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Thể loại chính <span className="text-red-500">*</span>
              </label>
              <select
                value={primaryGenre}
                onChange={(e) => {
                  setPrimaryGenre(e.target.value);
                  setSubGenres(subGenres.filter((g) => g !== e.target.value));
                }}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition cursor-pointer"
              >
                {availableGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Thể loại phụ */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Thể loại phụ (Tối đa 3)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableGenres
                  .filter((g) => g !== primaryGenre)
                  .map((g) => {
                    const isSelected = subGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleSubGenre(g)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? "bg-sky-500 text-white border-sky-500"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {g}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Thẻ Tag (Modal Checkboxes) & Lứa tuổi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thẻ Tag Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Thẻ Tag ({selectedTags.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setTagModalOpen(true)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Chọn thẻ tag</span>
                  </button>
                </div>

                <div className="min-h-[42px] p-2 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center gap-1.5">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-700 font-medium"
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
                      className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 px-1"
                    >
                      Nhấp vào để chọn thẻ tag cho truyện...
                    </span>
                  )}
                </div>
              </div>

              {/* Lứa tuổi */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Lứa tuổi độc giả
                </label>
                <select
                  value={ageLimit}
                  onChange={(e) => setAgeLimit(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition cursor-pointer"
                >
                  <option value="ALL">Mọi lứa tuổi (Phù hợp tất cả độc giả)</option>
                  <option value="16+">16+ (Có một số cảnh chiến đấu hoặc tình cảm)</option>
                  <option value="18+">18+ (Cảnh bạo lực, nội dung trưởng thành)</option>
                </select>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button size="sm" variant="primary" onClick={handleNextStep1}>
                Tiếp tục: Bìa & Tóm tắt →
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: BÌA & TÓM TẮT */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Ảnh bìa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
              <div className="w-full h-52 rounded-lg overflow-hidden border border-zinc-200 shadow-xs relative bg-linear-to-br from-sky-600 to-indigo-800 p-3.5 flex flex-col justify-between text-white">
                <span className="text-[10px] font-bold bg-white/20 self-start px-2 py-0.5 rounded-sm">
                  {primaryGenre}
                </span>
                <div className="text-center px-1">
                  <h4 className="font-extrabold text-base leading-tight line-clamp-3">
                    {title || "Tên tác phẩm"}
                  </h4>
                </div>
                <div className="text-center text-[10px] text-white/70 border-t border-white/20 pt-1">
                  Bìa xem trước (3:4)
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    URL ảnh bìa (600x800px)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Để trống nếu muốn hệ thống tự tạo bìa màu gradient.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Bìa truyện đẹp, rõ nét sẽ tăng tương tác và lượt click của độc giả.</span>
                </div>
              </div>
            </div>

            {/* Tóm tắt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Tóm tắt cốt truyện (Văn án) <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-zinc-400">{description.length} ký tự</span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu nội dung, mâu thuẫn nhân vật và điểm cuốn hút..."
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition leading-relaxed resize-none"
              />
            </div>

            {/* Lời ngỏ */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Lời ngỏ tác giả (tùy chọn)
              </label>
              <input
                type="text"
                value={authorNote}
                onChange={(e) => setAuthorNote(e.target.value)}
                placeholder="Lịch ra chương, lời nhắn nhủ..."
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setCurrentStep(1)}>
                ← Quay lại
              </Button>
              <Button size="sm" variant="primary" onClick={handleNextStep2}>
                Tiếp tục: Xuất bản →
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: XUẤT BẢN */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Hiển thị */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setVisibility("PUBLIC")}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  visibility === "PUBLIC"
                    ? "border-sky-500 bg-sky-50/40"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                  <strong className="text-xs sm:text-sm text-zinc-900">Công khai</strong>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Độc giả có thể tìm và đọc truyện.</p>
              </div>

              <div
                onClick={() => setVisibility("PRIVATE")}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  visibility === "PRIVATE"
                    ? "border-sky-500 bg-sky-50/40"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <strong className="text-xs sm:text-sm text-zinc-900">Riêng tư</strong>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Chỉ bạn thấy trong kho tác phẩm.</p>
              </div>
            </div>

            {/* Trạng thái lưu */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Trạng thái lưu
              </label>
              <div className={`grid grid-cols-1 gap-3 ${isEdit ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <div
                  onClick={() => setPublishStatus("DRAFT")}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    publishStatus === "DRAFT"
                      ? "border-sky-500 bg-sky-50/40"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <strong className="text-xs sm:text-sm text-zinc-900">Bản nháp</strong>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Lưu trữ để tiếp tục chỉnh sửa và viết chương.</p>
                </div>

                <div
                  onClick={() => setPublishStatus("PENDING_REVIEW")}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    publishStatus === "PENDING_REVIEW"
                      ? "border-sky-500 bg-sky-50/40"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-zinc-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong className="text-xs sm:text-sm text-zinc-900">Gửi duyệt biên tập</strong>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Gửi bản thảo đến ban biên tập kiểm duyệt.</p>
                </div>

                {isEdit && (
                  <div
                    onClick={() => setPublishStatus("PUBLISHED")}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      publishStatus === "PUBLISHED"
                        ? "border-sky-500 bg-sky-50/40"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-zinc-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <strong className="text-xs sm:text-sm text-zinc-900">Đã xuất bản online</strong>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Tác phẩm đang mở cho độc giả theo dõi.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cam kết */}
            <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <label className="flex items-start gap-2.5 text-xs text-zinc-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedCopyright}
                  onChange={(e) => setAgreedCopyright(e.target.checked)}
                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                />
                <span>
                  Tôi cam kết nắm giữ bản quyền hợp pháp và tuân thủ quy chế xuất bản của StoryVN.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setCurrentStep(2)}>
                ← Quay lại
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleFinalSubmit}
                isLoading={isSubmitting}
                disabled={!agreedCopyright}
              >
                {isEdit ? "Lưu thay đổi" : "Hoàn tất & Tạo truyện"}
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: HOÀN TẤT */}
        {currentStep === 4 && (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl shadow-xs">
              ✓
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                {isEdit ? "Đã lưu thay đổi thành công!" : "Tác phẩm đã được tạo thành công!"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                Tác phẩm <strong className="text-zinc-800">{title}</strong> đã được đồng bộ vào hệ thống.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/tac-gia/tac-pham")}
              >
                ← Về trang Quản lý tác phẩm
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  toast.success("Chuyển tới giao diện viết chương!");
                  router.push("/tac-gia/tac-pham");
                }}
              >
                + Quản lý chương
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal chọn thẻ tag dạng danh sách checkbox */}
      <TagPickerModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        selectedTags={selectedTags}
        onConfirm={(tags) => setSelectedTags(tags)}
      />
    </div>
  );
}
