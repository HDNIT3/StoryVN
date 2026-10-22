import React from "react";
import type { PublicAuthorProfile } from "@/features/author";

interface AuthorAboutTabProps {
  author: PublicAuthorProfile;
}

export function AuthorAboutTab({ author }: AuthorAboutTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE7DF] p-6 sm:p-8 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-bold text-stone-900 font-serif border-b border-[#EDE7DF] pb-3">
          Tiểu sử & Phong cách sáng tác
        </h2>
        <p className="mt-4 text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
          {author.biography || "Tác giả chưa cập nhật tiểu sử."}
        </p>
      </div>

      {author.website && (
        <div className="pt-4 border-t border-[#EDE7DF]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Trang cá nhân / Website
          </h3>
          <a
            href={author.website.startsWith("http") ? author.website : `https://${author.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#8B1E2D] hover:underline"
          >
            {author.website}
          </a>
        </div>
      )}
    </div>
  );
}
