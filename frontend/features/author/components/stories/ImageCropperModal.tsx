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

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const applyZoomStep = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +value.toFixed(2)));

type ImageCropperDialogProps = Omit<ImageCropperModalProps, "isOpen">;

// Modal được unmount khi đóng nên mỗi lần mở lại sẽ tự reset state.
export function ImageCropperModal({ isOpen, ...dialogProps }: ImageCropperModalProps) {
  if (!isOpen) return null;
  return <ImageCropperDialog key={dialogProps.imageSrc} {...dialogProps} />;
}

function ImageCropperDialog({
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 2 / 3, // Chuẩn bìa truyện 2:3
  outputWidth = 600,
}: ImageCropperDialogProps) {
  const [view, setView] = useState({
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
  const { zoom, offset } = view;
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Kích thước khung crop hiển thị trên giao diện (ví dụ: rộng 260px, cao 390px chuẩn 2:3)
  const cropBoxWidth = 260;
  const cropBoxHeight = Math.round(cropBoxWidth / aspectRatio); // 390px

  // Phóng ảnh vừa khít khung crop (cover): ảnh luôn phủ kín khung, không lộ nền trắng
  const baseScale =
    naturalSize.width > 0 && naturalSize.height > 0
      ? Math.max(cropBoxWidth / naturalSize.width, cropBoxHeight / naturalSize.height)
      : 0;
  const baseWidth = naturalSize.width * baseScale;
  const baseHeight = naturalSize.height * baseScale;
  const displayWidth = baseWidth * zoom;
  const displayHeight = baseHeight * zoom;

  const limitX = Math.max(0, (displayWidth - cropBoxWidth) / 2);
  const limitY = Math.max(0, (displayHeight - cropBoxHeight) / 2);

  const clampOffset = useCallback(
    (current: { x: number; y: number }, nextZoom: number) => {
      const maxX = Math.max(0, (baseWidth * nextZoom - cropBoxWidth) / 2);
      const maxY = Math.max(0, (baseHeight * nextZoom - cropBoxHeight) / 2);
      return {
        x: Math.min(Math.max(current.x, -maxX), maxX),
        y: Math.min(Math.max(current.y, -maxY), maxY),
      };
    },
    [baseHeight, baseWidth, cropBoxHeight, cropBoxWidth]
  );

  // Thu phóng kèm kẹp vị trí để ảnh không hở khung
  const changeZoom = useCallback(
    (nextZoom: number) => {
      setView((prev) => {
        const value = applyZoomStep(nextZoom);
        return { zoom: value, offset: clampOffset(prev.offset, value) };
      });
    },
    [clampOffset]
  );

  const zoomBy = useCallback(
    (delta: number) => {
      setView((prev) => {
        const value = applyZoomStep(prev.zoom + delta);
        return { zoom: value, offset: clampOffset(prev.offset, value) };
      });
    },
    [clampOffset]
  );

  // Cuộn chuột để zoom (gắn native để preventDefault không bị passive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 0.1 : -0.1);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomBy]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setNaturalSize({ width: naturalWidth, height: naturalHeight });
    }
    setImageLoaded(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageLoaded) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setView((prev) => ({
      ...prev,
      offset: {
        x: Math.min(
          Math.max(e.clientX - dragStartRef.current.x, -limitX),
          limitX
        ),
        y: Math.min(
          Math.max(e.clientY - dragStartRef.current.y, -limitY),
          limitY
        ),
      },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setView({ zoom: 1, offset: { x: 0, y: 0 } });
  };

  const handleApplyCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img || !imageLoaded || naturalSize.width === 0 || displayWidth === 0) {
      return;
    }

    const outputHeight = Math.round(outputWidth / aspectRatio);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Quy đổi khung crop trên màn hình về đúng vùng pixel trên ảnh gốc
    const scaleX = naturalSize.width / displayWidth;
    const scaleY = naturalSize.height / displayHeight;

    const rawSourceX =
      ((displayWidth - cropBoxWidth) / 2 - offset.x) * scaleX;
    const rawSourceY =
      ((displayHeight - cropBoxHeight) / 2 - offset.y) * scaleY;
    const rawSourceWidth = cropBoxWidth * scaleX;
    const rawSourceHeight = cropBoxHeight * scaleY;

    // Kẹp trong biên ảnh để tránh sai số dấu phẩy động
    const sourceX = Math.min(
      Math.max(rawSourceX, 0),
      Math.max(0, naturalSize.width - 1)
    );
    const sourceY = Math.min(
      Math.max(rawSourceY, 0),
      Math.max(0, naturalSize.height - 1)
    );
    const sourceWidth = Math.max(
      1,
      Math.min(rawSourceWidth, naturalSize.width - sourceX)
    );
    const sourceHeight = Math.max(
      1,
      Math.min(rawSourceHeight, naturalSize.height - sourceY)
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

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
  }, [
    aspectRatio,
    cropBoxHeight,
    cropBoxWidth,
    displayHeight,
    displayWidth,
    imageLoaded,
    naturalSize.height,
    naturalSize.width,
    offset.x,
    offset.y,
    onClose,
    onCropComplete,
    outputWidth,
  ]);

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
          className="relative bg-zinc-900 p-6 flex items-center justify-center overflow-hidden select-none touch-none min-h-[440px]"
        >
          {/* Vùng Crop Box cố định tỉ lệ 2:3 */}
          <div
            style={{ width: `${cropBoxWidth}px`, height: `${cropBoxHeight}px` }}
            className="relative rounded-md overflow-hidden shadow-2xl border-2 border-white ring-2 ring-black/40 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
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
                onLoad={handleImageLoad}
                onError={() => {
                  setImageLoaded(false);
                  setImageError(true);
                }}
                draggable={false}
                style={{
                  width: displayWidth > 0 ? `${displayWidth}px` : undefined,
                  height: displayHeight > 0 ? `${displayHeight}px` : undefined,
                  maxWidth: "none",
                  maxHeight: "none",
                  opacity: imageLoaded ? 1 : 0,
                }}
                className="pointer-events-none select-none"
              />
            </div>

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/80 pointer-events-none">
                <span className="text-[11px] font-medium text-zinc-300">
                  {imageError ? "Không tải được ảnh" : "Đang tải ảnh..."}
                </span>
              </div>
            )}

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
              onClick={() => zoomBy(-0.2)}
              className="w-6 h-6 rounded bg-zinc-200 hover:bg-zinc-300 text-xs font-bold text-zinc-700 flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.05"
              value={zoom}
              onChange={(e) => changeZoom(parseFloat(e.target.value))}
              className="flex-1 accent-sky-600 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => zoomBy(0.2)}
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
            disabled={!imageLoaded || imageError}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Áp dụng cắt ảnh
          </button>
        </div>
      </div>
    </div>
  );
}
