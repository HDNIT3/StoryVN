import React from "react";
import Image from "next/image";
import type { StoryRatingItem } from "../types";

interface RatingItemCardProps {
  rating: StoryRatingItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export const RatingItemCard: React.FC<RatingItemCardProps> = ({ rating }) => {
  const user = rating.userId;
  const displayName = user?.displayName || user?.username || "Độc giả";
  const avatarUrl = user?.avatarUrl;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-emerald-800 bg-emerald-100">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 leading-tight">
                {displayName}
              </span>
              {user?.role && (user.role === "ADMIN" || user.role === "MANAGER") && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                  {user.role}
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {formatDate(rating.createdAt)}
            </div>
          </div>
        </div>

        {/* Số sao */}
        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
          <span className="text-amber-500 font-black text-xs">
            {rating.rating}
          </span>
          <div className="flex text-amber-400 text-xs">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s}>{s <= rating.rating ? "★" : "☆"}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Review content */}
      {rating.review ? (
        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line pl-13">
          {rating.review}
        </p>
      ) : (
        <p className="text-xs text-zinc-400 italic pl-13">
          (Đánh giá không kèm nhận xét)
        </p>
      )}
    </div>
  );
};

