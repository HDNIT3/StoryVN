import React from "react";
import type { MediaItem } from "@/features/upload";

interface MediaPreviewModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onCopyUrl: (url: string) => void;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
};

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  item,
  onClose,
  onCopyUrl,
}) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm font-bold text-zinc-900 truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
              <span
                className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                  item.source === "cloud"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {item.source === "cloud" ? "Cloudinary" : "Local Storage"}
              </span>
              {item.format && (
                <span className="uppercase font-mono">{item.format}</span>
              )}
              {item.size ? <span>• {formatFileSize(item.size)}</span> : null}
              {item.width && item.height ? (
                <span>• {item.width}×{item.height}px</span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 flex items-center justify-center min-h-[300px] max-h-[60vh]">
          <img
            src={item.url}
            alt={item.name}
            className="max-w-full max-h-[55vh] object-contain rounded shadow-lg"
          />
        </div>

        {/* Modal Footer & Copy URL */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
          <input
            type="text"
            readOnly
            value={item.url}
            className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded text-xs text-zinc-600 font-mono select-all focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => onCopyUrl(item.url)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs shrink-0"
          >
            Sao chép link
          </button>
        </div>
      </div>
    </div>
  );
};
