export interface AdminDashboardRevenueKPI {
  total: number;
  today: number;
  thisMonth: number;
  lastMonth: number;
  growthRate: number;
  totalTransactions: number;
  todayTransactions: number;
  coins: {
    base: number;
    bonus: number;
    total: number;
  };
}

export interface AdminDashboardUsersKPI {
  total: number;
  active: number;
  banned: number;
  roles: {
    user: number;
    author: number;
    manager: number;
    admin: number;
  };
  newToday: number;
  newYesterday: number;
  growthToday: number;
  new7Days: number;
}

export interface AdminDashboardStoriesKPI {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  draft: number;
  totalViews: number;
  totalFollows: number;
}

export interface AdminDashboardChaptersKPI {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  draft: number;
}

export interface AdminDashboardPendingSummary {
  stories: number;
  chapters: number;
  authorRequests: number;
  totalPending: number;
}

export interface AdminDashboardEngagementKPI {
  totalComments: number;
  visibleComments: number;
  hiddenComments: number;
  deletedComments: number;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface AdminDashboardTimelinePoint {
  date: string;
  label: string;
  revenue: number;
  coins: number;
  transactions: number;
  newUsers: number;
  views: number;
}

export interface AdminDashboardCategoryDist {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardTopStory {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  views: number;
  likes: number;
  chapterCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface AdminDashboardRecentTx {
  _id: string;
  orderCode: string;
  amount: number;
  coinAmount: number;
  bonusCoin: number;
  totalCoin: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  bankCode: string;
  cardType?: string | null;
  createdAt: string;
  packageName: string;
  user: {
    _id: string;
    displayName: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface AdminDashboardUrgentStory {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  authorName: string;
  createdAt: string;
}

export interface AdminDashboardUrgentChapter {
  _id: string;
  title: string;
  chapterNumber: number;
  storyTitle: string;
  createdAt: string;
}

export interface AdminDashboardUrgentAuthorRequest {
  _id: string;
  penName: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  experience?: string;
  createdAt: string;
}

export interface AdminDashboardOverviewData {
  kpi: {
    revenue: AdminDashboardRevenueKPI;
    users: AdminDashboardUsersKPI;
    stories: AdminDashboardStoriesKPI;
    chapters: AdminDashboardChaptersKPI;
    pendingSummary: AdminDashboardPendingSummary;
    engagement: AdminDashboardEngagementKPI;
    transactionsBreakdown: {
      SUCCESS: number;
      PENDING: number;
      FAILED: number;
    };
  };
  charts: {
    timeline: AdminDashboardTimelinePoint[];
    categories: AdminDashboardCategoryDist[];
    ratings: Record<number, number>;
  };
  topStories: AdminDashboardTopStory[];
  recentTransactions: AdminDashboardRecentTx[];
  urgentQueue: {
    stories: AdminDashboardUrgentStory[];
    chapters: AdminDashboardUrgentChapter[];
    authorRequests: AdminDashboardUrgentAuthorRequest[];
  };
}

