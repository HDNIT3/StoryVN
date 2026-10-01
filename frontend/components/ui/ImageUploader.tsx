"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { uploadService } from "@/lib/services/upload.service";
import { toast } from "@/lib/toast";

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "cover" | "any";
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  folder = "images",
  label,
  aspectRatio = "square",
  className = "",
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
    // Reset input so user can re-select same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processAndUploadFile = async (file: File) => {
    if (disabled || isUploading) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file tối đa là 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadService.uploadImage(file, folder);
      if (res.success && res.data?.url) {
        onChange(res.data.url);
        setUrlInput(res.data.url);
        toast.success("Tải ảnh lên thành công!");
      } else {
        throw new Error(res.message || "Tải ảnh thất bại");
      }
    } catch (err: any) {
      const errorMsg =
        err?.message && !err.message.includes("Failed to fetch")
          ? err.message
          : "Không thể tải ảnh lên, vui lòng thử lại";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setUrlInput("");
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast.success("Đã áp dụng đường dẫn ảnh!");
    }
  };

  const containerAspectClass =
    aspectRatio === "square"
      ? "w-24 h-24 sm:w-28 sm:h-28"
      : aspectRatio === "cover"
      ? "w-full h-36 sm:h-44"
      : "w-full min-h-[120px]";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-semibold text-zinc-600">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`cursor-pointer px-2 py-0.5 rounded-md transition ${
              mode === "file"
                ? "bg-sky-100 text-sky-700 font-bold"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            📁 Tải từ máy
          </button>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`cursor-pointer px-2 py-0.5 rounded-md transition ${
              mode === "url"
                ? "bg-sky-100 text-sky-700 font-bold"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            🔗 Dán link
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />

          <div className="flex items-center gap-4">
            {/* Upload / Preview Box */}
            <div
              onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative ${containerAspectClass} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden select-none shrink-0 ${
                isDragging
                  ? "border-sky-500 bg-sky-50/80 scale-[1.02]"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 hover:border-sky-400"
              } ${disabled || isUploading ? "pointer-events-none opacity-80" : ""}`}
            >
              {value ? (
                <>
                  <Image
                    src={value}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium gap-1">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Thay ảnh</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-400">
                  <svg
                    className="w-6 h-6 mb-1 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-[11px] font-medium leading-tight">
                    Tải ảnh lên
                  </span>
                </div>
              )}

              {/* Uploading Spinner */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-medium">Đang tải...</span>
                </div>
              )}
            </div>

            {/* Helper Text and Quick Actions */}
            <div className="flex-1 space-y-2">
              <div className="text-xs text-zinc-500">
                <p className="font-semibold text-zinc-700">
                  Chọn ảnh từ máy tính hoặc kéo thả vào ô
                </p>
                <p className="text-zinc-400 mt-0.5">
                  Định dạng PNG, JPG, WEBP, GIF (Tối đa 5MB)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition disabled:opacity-50"
                >
                  {value ? "Chọn ảnh khác" : "Chọn file ảnh"}
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled || isUploading}
                    className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition disabled:opacity-50"
                  >
                    Xoá ảnh
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Direct URL Mode */
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="cursor-pointer px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition"
            >
              Áp dụng
            </button>
          </div>

          {value && (
            <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => onChange("")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-700 truncate">
                  Đường dẫn hiện tại
                </p>
                <p className="text-[11px] text-zinc-400 truncate">{value}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="cursor-pointer text-xs font-semibold text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                title="Xoá ảnh"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
