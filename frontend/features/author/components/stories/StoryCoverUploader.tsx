"use client";

import React, { RefObject } from "react";

interface StoryCoverUploaderProps {
  coverSourceType: "file" | "url";
  previewUrl: string;
  imageUrlInput: string;
  selectedFile: File | null;
  imageLoadError: boolean;
  coverInputId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onCoverSourceTypeChange: (type: "file" | "url") => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlInputChange: (url: string) => void;
  onRemoveCover: () => void;
  onOpenCropper: () => void;
  setImageLoadError: (hasError: boolean) => void;
}

export function StoryCoverUploader({
  coverSourceType,
  previewUrl,
  imageUrlInput,
  selectedFile,
  imageLoadError,
  coverInputId,
  fileInputRef,
  onCoverSourceTypeChange,
  onFileChange,
  onUrlInputChange,
  onRemoveCover,
  onOpenCropper,
  setImageLoadError,
}: StoryCoverUploaderProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h2 className="text-base font-bold text-zinc-900">
          Ảnh bìa tác phẩm
        </h2>
        {/* Tab chuyển đổi chế độ nạp ảnh */}
        <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onCoverSourceTypeChange("file")}
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
            onClick={() => onCoverSourceTypeChange("url")}
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
                  onClick={onOpenCropper}
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
            onChange={onFileChange}
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
                onClick={onOpenCropper}
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
                onClick={onRemoveCover}
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
                onChange={(e) => onUrlInputChange(e.target.value)}
                placeholder="https://example.com/anh-bia.jpg"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 pr-14"
              />
              {imageUrlInput && (
                <button
                  type="button"
                  onClick={onRemoveCover}
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
                onClick={onRemoveCover}
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
  );
}
