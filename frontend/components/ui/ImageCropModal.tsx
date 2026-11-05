"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

export interface ImageCropModalProps {
  file: File;
  aspect?: number;
  onCancel: () => void;
  onComplete: (file: File) => void | Promise<void>;
}

interface DragState {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  frameWidth: number;
  frameHeight: number;
}

export function ImageCropModal({
  file,
  aspect = 3,
  onCancel,
  onComplete,
}: ImageCropModalProps) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const ratios = () => {
    const imageRatio = natural.width / natural.height;
    return {
      displayWidth: Math.max(1, imageRatio / aspect) * zoom,
      displayHeight: Math.max(1, aspect / imageRatio) * zoom,
    };
  };

  const clampOffset = (x: number, y: number, zoomValue = zoom) => {
    if (!natural.width || !natural.height) return { x: 0, y: 0 };
    const imageRatio = natural.width / natural.height;
    const maxX = Math.max(0, (Math.max(1, imageRatio / aspect) * zoomValue - 1) / 2);
    const maxY = Math.max(0, (Math.max(1, aspect / imageRatio) * zoomValue - 1) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      frameWidth: rect.width,
      frameHeight: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(
      clampOffset(
        drag.offsetX + (e.clientX - drag.startX) / drag.frameWidth,
        drag.offsetY + (e.clientY - drag.startY) / drag.frameHeight
      )
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    setOffset((prev) => clampOffset(prev.x, prev.y, value));
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !natural.width || !natural.height) return;

    setIsSaving(true);
    try {
      const imageRatio = natural.width / natural.height;
      const displayWidth = Math.max(1, imageRatio / aspect) * zoom;
      const displayHeight = Math.max(1, aspect / imageRatio) * zoom;
      const cropWidth = natural.width / displayWidth;
      const cropHeight = natural.height / displayHeight;
      const sourceX =
        natural.width / 2 - offset.x * cropWidth - cropWidth / 2;
      const sourceY =
        natural.height / 2 - offset.y * cropHeight - cropHeight / 2;

      const outputWidth = 1500;
      const outputHeight = Math.round(outputWidth / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể xử lý ảnh");

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Không thể tạo ảnh đã cắt");

      const baseName = file.name.replace(/\.[^.]+$/, "") || "cover";
      await onComplete(
        new File([blob], `${baseName}-cover.jpg`, { type: "image/jpeg" })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const { displayWidth, displayHeight } = ratios();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-crop-title"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-4 sm:p-5 space-y-4"
      >
        <div>
          <h2 id="cover-crop-title" className="text-base font-bold text-zinc-900">
            Cắt ảnh bìa
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Kéo ảnh để căn vị trí, dùng thanh trượt để thu phóng. Khung cắt tỷ lệ{" "}
            {aspect}:1 đúng như trang công khai.
          </p>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full aspect-[3/1] overflow-hidden rounded-xl bg-zinc-900 touch-none cursor-move select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt="Ảnh cần cắt"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ width: el.naturalWidth, height: el.naturalHeight });
            }}
            className="absolute max-w-none pointer-events-none"
            style={{
              width: `${displayWidth * 100}%`,
              height: `${displayHeight * 100}%`,
              left: `calc(50% + ${offset.x * 100}%)`,
              top: `calc(50% + ${offset.y * 100}%)`,
              transform: "translate(-50%, -50%)",
            }}
          />
          <div className="absolute inset-0 ring-2 ring-white/70 ring-inset rounded-xl pointer-events-none" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">Thu nhỏ</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-sky-500 cursor-pointer"
            aria-label="Thu phóng ảnh"
          />
          <span className="text-xs font-medium text-zinc-500">Phóng to</span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={isSaving}>
            Huỷ
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleConfirm} isLoading={isSaving}>
            Cắt và tải lên
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
