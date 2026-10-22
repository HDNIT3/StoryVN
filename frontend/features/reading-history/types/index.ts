/** Tiêu chí sắp xếp danh sách lịch sử đọc */
export type ReadingHistorySortOption = "lastReadAt" | "progress" | "title";

/** Trạng thái đọc của một truyện: đang đọc hay đã đọc hết số chương hiện có */
export type ReadingStatusFilter = "reading" | "completed";

/** Thông tin rút gọn của một chương */
export interface ReadingHistoryChapterInfo {
  _id: string;
  chapterNumber: number;
  title: string;
}

/** Thông tin rút gọn của truyện trong lịch sử đọc */
export interface ReadingHistoryStoryInfo {
  _id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
}

/** Thống kê đọc của một chương (mỗi chương chỉ có một dòng, đã gộp trùng) */
export interface ReadingHistoryChapterDetail {
  chapter: ReadingHistoryChapterInfo | null;
  firstReadAt: string;
  lastReadAt: string;
  readCount: number;
}

/** Một truyện trong danh sách lịch sử đọc (kèm tối đa 3 chương gần đây) */
export interface ReadingHistoryStoryItem {
  story: ReadingHistoryStoryInfo;
  firstReadAt: string;
  lastReadAt: string;
  highestChapterNumber: number;
  chaptersReadCount: number;
  /** Tổng số chương đã phát hành của truyện (dùng để tính % tiến độ) */
  totalChapters: number;
  readCount: number;
  progressPercent: number;
  currentChapter: ReadingHistoryChapterInfo | null;
  recentChapters: ReadingHistoryChapterDetail[];
}

/** Chi tiết lịch sử đọc của 1 truyện: toàn bộ chương đã đọc */
export interface ReadingHistoryStoryDetail {
  story: ReadingHistoryStoryInfo;
  firstReadAt: string;
  lastReadAt: string;
  highestChapterNumber: number;
  chaptersReadCount: number;
  totalChapters: number;
  readCount: number;
  progressPercent: number;
  currentChapter: ReadingHistoryChapterInfo | null;
  chapters: ReadingHistoryChapterDetail[];
}

export interface QueryReadingHistoryParams {
  search?: string;
  genre?: string;
  status?: ReadingStatusFilter;
  minChapterNumber?: number;
  from?: string;
  to?: string;
  sortBy?: ReadingHistorySortOption;
  page?: number;
  limit?: number;
}

export interface ReadingHistoryPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedReadingHistory {
  items: ReadingHistoryStoryItem[];
  pagination: ReadingHistoryPagination;
}

/** Kết quả ghi nhận một lần đọc chương */
export interface RecordReadingHistoryResult {
  recorded: boolean;
  log: {
    _id: string;
    storyId: string;
    chapterId: string;
    readAt: string;
  };
}
