"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  aspectRatio?: number; // width / height (mặc định 2 / 3 = 0.6667)
  outputWidth?: number; // mặc định 600px
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 2 / 3, // Chuẩn bìa truyện 2:3
  outputWidth = 600,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Kích thước khung crop hiển thị trên giao diện (ví dụ: rộng 260px, cao 390px chuẩn 2:3)
  const cropBoxWidth = 260;
  const cropBoxHeight = Math.round(cropBoxWidth / aspectRatio); // 390px

  // Reset state khi mở modal hoặc đổi ảnh
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + zoomFactor).toFixed(2))));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApplyCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img || !imageLoaded) return;

    const outputHeight = Math.round(outputWidth / aspectRatio);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Tính toán tỉ lệ giữa ảnh gốc và khung hiển thị
    const renderedWidth = img.clientWidth * zoom;
    const renderedHeight = img.clientHeight * zoom;

    // Tỉ lệ scale thực tế giữa ảnh hiển thị và output canvas
    const scaleRatio = outputWidth / cropBoxWidth;

    // Vị trí tâm ảnh hiển thị so với tâm khung crop
    const centerX = cropBoxWidth / 2 + offset.x;
    const centerY = cropBoxHeight / 2 + offset.y;

    const imgLeftInCrop = centerX - renderedWidth / 2;
    const imgTopInCrop = centerY - renderedHeight / 2;

    // Chuyển sang toạ độ trên canvas output
    const drawX = imgLeftInCrop * scaleRatio;
    const drawY = imgTopInCrop * scaleRatio;
    const drawWidth = renderedWidth * scaleRatio;
    const drawHeight = renderedHeight * scaleRatio;

    // Làm nền trắng nếu có khoảng trống
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Vẽ ảnh lên canvas
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `cover-cropped-${Date.now()}.webp`, {
          type: "image/webp",
        });
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(file, previewUrl);
        onClose();
      },
      "image/webp",
      0.92
    );
  }, [aspectRatio, cropBoxHeight, cropBoxWidth, imageLoaded, offset.x, offset.y, onClose, onCropComplete, outputWidth, zoom]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Cắt ảnh bìa (Tỉ lệ chuẩn 2:3)
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Kéo di chuyển ảnh và phóng to để chọn khung hình đẹp nhất
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Viewport & Crop Stage */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className="relative bg-zinc-900 p-6 flex items-center justify-center overflow-hidden select-none touch-none min-h-[440px]"
        >
          {/* Vùng Crop Box cố định tỉ lệ 2:3 */}
          <div
            style={{ width: `${cropBoxWidth}px`, height: `${cropBoxHeight}px` }}
            className="relative rounded-md overflow-hidden shadow-2xl border-2 border-white ring-2 ring-black/40 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Ảnh đang được dịch chuyển và zoom */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={() => setImageLoaded(true)}
                draggable={false}
                style={{
                  transform: `scale(${zoom})`,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
                className="pointer-events-none transition-transform duration-75 ease-out select-none"
              />
            </div>

            {/* Lưới bố cục 1/3 (Rule of thirds grid) */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/30">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>

            {/* Nhãn tỉ lệ */}
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium pointer-events-none">
              Tỉ lệ 2:3
            </span>
          </div>
        </div>

        {/* Controls: Zoom slider & Reset */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Thu phóng:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
              className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-300 text-xs font-bold text-zinc-700 flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-sky-600 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
              className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-300 text-xs font-bold text-zinc-700 flex items-center justify-center cursor-pointer"
            >
              +
            </button>
            <span className="text-xs font-mono text-zinc-600 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Độ phân giải chuẩn: 600 × 900 px</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-sky-600 hover:underline cursor-pointer font-medium"
            >
              Đặt lại vị trí
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-4 py-3 border-t border-zinc-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer shadow-2xs"
          >
            Áp dụng cắt ảnh
          </button>
        </div>
      </div>
    </div>
  );
}
