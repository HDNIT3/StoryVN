export interface AuthorAnalyticsMetrics {
  stories: number;
  chapters: number;
  views: number;
  comments: number;
  ratings: number;
  follows: number;
  unlocks: number;
  coins: number;
}

export interface AuthorAnalyticsData {
  range: {
    mode: "all" | "range";
    startDate: string | null;
    endDate: string | null;
  };
  period: AuthorAnalyticsMetrics & { ratingAverage: number | null };
  growth: Record<keyof AuthorAnalyticsMetrics, number> | null;
  snapshot: {
    stories: number;
    chapters: number;
    publishedChapters: number;
    words: number;
    views: number;
    follows: number;
    ratings: number;
    ratingAverage: number | null;
  };
  timeline: (AuthorAnalyticsMetrics & { date: string; label: string })[];
  distribution: { stars: number; count: number }[];
  snapshotDistribution: { stars: number; count: number }[];
  storyStatuses: Record<string, number>;
  chapterStatuses: Record<string, number>;
  stories: (AuthorAnalyticsMetrics & {
    _id: string;
    title: string;
    slug: string;
    status: string;
    progressState: string;
    totalViews: number;
    totalChapters: number;
    totalWords: number;
    followers: number;
    ratingCount: number;
    ratingAverage: number | null;
  })[];
  chapters: {
    _id: string;
    storyId: string;
    title: string;
    chapterNumber: number;
    status: string;
    isFree: boolean;
    words: number;
    totalViews: number;
    unlocks: number;
    coins: number;
  }[];
}
