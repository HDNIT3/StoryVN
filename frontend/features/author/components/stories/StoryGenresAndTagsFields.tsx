"use client";

import React from "react";

interface StoryGenresAndTagsFieldsProps {
  selectedGenres: string[];
  selectedTags: string[];
  onOpenGenreModal: () => void;
  onOpenTagModal: () => void;
  onRemoveGenre: (genre: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function StoryGenresAndTagsFields({
  selectedGenres,
  selectedTags,
  onOpenGenreModal,
  onOpenTagModal,
  onRemoveGenre,
  onRemoveTag,
}: StoryGenresAndTagsFieldsProps) {
  return (
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
            onClick={onOpenGenreModal}
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
                  onClick={() => onRemoveGenre(genre)}
                  className="text-zinc-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span
              onClick={onOpenGenreModal}
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
            onClick={onOpenTagModal}
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
                  onClick={() => onRemoveTag(tag)}
                  className="text-zinc-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span
              onClick={onOpenTagModal}
              className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-600 px-1"
            >
              Bấm vào đây để chọn các thẻ tag cho tác phẩm...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
