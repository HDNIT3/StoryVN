import api from '@/lib/api';
import type { SameGenreStoryItem, StoryApiResponse, StoryViewTimeFrame } from '../types';

export type RankingMetric = 'views' | 'follows' | 'rating' | 'purchases' | 'revenue';
export interface RankingItem extends SameGenreStoryItem {
  rank: number;
  metricValue: number;
  metricCount?: number;
  stats: SameGenreStoryItem['stats'] & { ratingCount: number };
}

export interface AuthorRankingItem {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  stats: { followerCount: number; storyCount: number; totalViews: number };
  metricValue: number;
  metricCount?: number;
  rank: number;
}
export interface RankingsData {
  items: RankingItem[];
  metric: RankingMetric;
  timeFrame: StoryViewTimeFrame;
  dateMode?: 'day' | 'month' | 'year';
  date?: string;
  month?: string;
  year?: string;
  page: number;
  hasNextPage: boolean;
}

export interface AuthorRankingsData extends Omit<RankingsData, 'items'> {
  items: AuthorRankingItem[];
}
export interface RecommendationsData {
  items: (SameGenreStoryItem & { description?: string })[];
  personalized: boolean;
  readingContext: {
    chapterNumber: number;
    chaptersRead: number;
    totalChapters: number;
    progressPercent: number;
  } | null;
}

export const discoveryService = {
  rankings(metric: RankingMetric, timeFrame: StoryViewTimeFrame, page = 1, dateFilter: { dateMode?: 'day' | 'month' | 'year'; date?: string; month?: string; year?: string } = {}) {
    const params = new URLSearchParams({ metric, timeFrame, page: String(page), limit: '10' });
    Object.entries(dateFilter).forEach(([key, value]) => value && params.set(key, value));
    return api.get<StoryApiResponse<RankingsData>>(`/stories/rankings?${params}`);
  },
  authorRankings(metric: RankingMetric, timeFrame: StoryViewTimeFrame, page = 1, dateFilter: { dateMode?: 'day' | 'month' | 'year'; date?: string; month?: string; year?: string } = {}) {
    const params = new URLSearchParams({ metric, timeFrame, page: String(page), limit: '10' });
    Object.entries(dateFilter).forEach(([key, value]) => value && params.set(key, value));
    return api.get<StoryApiResponse<AuthorRankingsData>>(
      `/stories/rankings/authors?${params}`,
    );
  },
  recommendations(storyId?: string) {
    const params = new URLSearchParams({ limit: '6' });
    if (storyId) params.set('storyId', storyId);
    return api.get<StoryApiResponse<RecommendationsData>>(`/stories/recommendations?${params}`);
  },
};
