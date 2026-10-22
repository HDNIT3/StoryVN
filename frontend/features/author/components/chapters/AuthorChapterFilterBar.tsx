import React from "react";

interface AuthorChapterFilterBarProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PUBLISHED", label: "Xuất bản" },
  { key: "PENDING_REVIEW", label: "Chờ duyệt" },
  { key: "DRAFT", label: "Bản nháp" },
  { key: "REJECTED", label: "Bị từ chối" },
];

export function AuthorChapterFilterBar({
  searchKeyword,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: AuthorChapterFilterBarProps) {
  return (
    <div className="p-3.5 sm:p-4 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <svg
          className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo tiêu đề hoặc số chương..."
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-md pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              statusFilter === tab.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
