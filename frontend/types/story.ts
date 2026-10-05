export type StoryStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
export type StoryVisibility = "PUBLIC" | "PRIVATE";

export interface StoryStats {
  viewCount: number;
  followCount: number;
  ratingCount: number;
  ratingAverage: number;
  chapterCount: number;
}

export interface StoryItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  genres: string[];
  tags: string[];
  status: StoryStatus;
  visibility: StoryVisibility;
  stats: StoryStats;
  authorPenName?: string;
  rejectReason?: string;
  publishedAt?: string | null;
  updatedAt: string;
  createdAt: string;
}
