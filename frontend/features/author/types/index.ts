import type { UserRole } from "@/features/user";

/** Trạng thái đơn yêu cầu nâng cấp tác giả */
export type AuthorRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Trạng thái hoạt động của hồ sơ tác giả */
export type AuthorProfileStatus = "ACTIVE" | "INACTIVE";

/** Hành động xét duyệt của Admin/Manager */
export type ReviewAction = "APPROVED" | "REJECTED";

/** Dữ liệu gửi lên khi người dùng tạo đơn đăng ký làm tác giả */
export interface CreateAuthorRequestPayload {
  penName: string;
  biography?: string;
  website?: string;
  socialLinks?: Record<string, any>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  reason?: string;
}

/** Dữ liệu gửi lên khi cập nhật đơn đăng ký tác giả */
export interface UpdateAuthorRequestPayload {
  penName?: string;
  biography?: string;
  website?: string;
  socialLinks?: Record<string, any>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  reason?: string;
}

/** Dữ liệu gửi lên khi tác giả cập nhật hồ sơ công khai của mình */
export interface UpdateAuthorProfilePayload {
  coverUrl?: string;
  biography?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

/** Dữ liệu gửi lên khi duyệt / từ chối đơn đăng ký */
export interface ReviewAuthorRequestPayload {
  status: ReviewAction;
  adminNote?: string;
}

/** Tham số tìm kiếm và phân trang danh sách đơn đăng ký */
export interface QueryAuthorRequestsParams {
  page?: number;
  limit?: number;
  status?: AuthorRequestStatus;
  search?: string;
}

/** Chi tiết một đơn yêu cầu làm tác giả */
export interface AuthorRequestItem {
  _id: string;
  userId:
  | string
  | {
    _id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    role: UserRole;
    status: string;
  };
  penName: string;
  biography?: string | null;
  website?: string | null;
  socialLinks?: Record<string, any>;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  reason?: string | null;
  status: AuthorRequestStatus;
  processedBy?:
  | string
  | {
    _id: string;
    email: string;
    username: string;
    displayName: string;
    role: UserRole;
  }
  | null;
  processedAt?: string | null;
  adminNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Chi tiết hồ sơ tác giả */
export interface AuthorProfileItem {
  _id: string;
  userId: string;
  penName: string;
  coverUrl?: string | null;
  biography?: string | null;
  website?: string | null;
  socialLinks?: Record<string, any>;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  followerCount?: number;
  storyCount?: number;
  totalViews?: number;
  status: AuthorProfileStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Dữ liệu trạng thái tác giả & đơn đăng ký trả về cho người dùng */
export interface AuthorRequestStatusData {
  currentRole: UserRole;
  isAuthor: boolean;
  isProcessed: boolean;
  canEdit: boolean;
  request: AuthorRequestItem | null;
  authorProfile: AuthorProfileItem | null;
}

/** Thông tin phân trang */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Danh sách đơn đăng ký kèm phân trang */
export interface PaginatedAuthorRequests {
  items: AuthorRequestItem[];
  pagination: PaginationMeta;
  counts?: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

/** Cấu trúc chuẩn phản hồi từ API Author Request */
export interface AuthorRequestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/** Thông tin tài khoản ngân hàng để độc giả ủng hộ (Donate / Tip) */
export interface AuthorDonateInfo {
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

/** Dữ liệu hồ sơ công khai của tác giả */
export interface PublicAuthorProfile {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  biography?: string | null;
  website?: string | null;
  socialLinks?: Record<string, any>;
  followerCount: number;
  storyCount: number;
  totalViews: number;
  ratingAverage: number;
  counts: {
    all: number;
    ongoing: number;
    completed: number;
    onHold: number;
  };
  joinedAt: string;
  donateInfo?: AuthorDonateInfo;
}

/** Thẻ truyện công khai của tác giả */
export interface AuthorStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  description?: string;
  genres: Array<{ _id: string; name: string; slug: string }>;
  tags: Array<{ _id: string; name: string; slug: string }>;
  ageRating: string;
  progressState: string;
  stats: {
    viewCount: number;
    followCount: number;
    ratingAverage: number;
    ratingCount: number;
    chapterCount: number;
    wordCount: number;
  };
  updatedAt: string;
  publishedAt?: string;
}

/** Tham số lọc và phân trang tác phẩm của tác giả */
export interface QueryAuthorPublicStoriesParams {
  page?: number;
  limit?: number;
  progressState?: string;
  sortBy?: "latest" | "views" | "rating" | "chapters";
  search?: string;
}

/** Danh sách tác phẩm công khai của tác giả có phân trang */
export interface PaginatedAuthorStories {
  items: AuthorStoryItem[];
  pagination: PaginationMeta;
}

/** Số liệu thống kê cộng đồng sáng tác StoryVN */
export interface AuthorCommunityStats {
  totalAuthors: number;
  totalStories: number;
  totalChapters: number;
}

/** Tác giả trong danh sách cộng đồng */
export interface AuthorListItem {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl?: string | null;
  biography?: string | null;
  genres: Array<{ _id: string; name: string; slug: string }>;
  followerCount: number;
  storyCount: number;
  totalViews: number;
  joinedAt?: string;
  latestStoryUpdatedAt?: string;
}

/** Tham số lọc và phân trang danh sách tác giả */
export interface QueryAuthorsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "featured" | "newest" | "updated" | "stories";
  genreId?: string;
  progressState?: string;
  hasBio?: "all" | "yes" | "no";
}

/** Danh sách tác giả có phân trang */
export interface PaginatedAuthorsList {
  items: AuthorListItem[];
  pagination: PaginationMeta;
}

/** Điểm dữ liệu biểu đồ theo ngày */
export interface AuthorChartPoint {
  date: string;
  label: string;
  value: number;
}

/** Chuỗi dữ liệu biểu đồ theo kỳ (7 / 30 / 90 ngày) */
export interface AuthorChartSeries {
  items: AuthorChartPoint[];
  total: number;
  growthPercent: number;
}

/** Bình luận gần đây trên tác phẩm của tác giả */
export interface AuthorRecentCommentItem {
  _id: string;
  user: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  story: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  chapter: {
    _id: string;
    chapterNumber: number;
    title: string;
  } | null;
  content: string;
  likeCount: number;
  createdAt: string;
}

/** Thông báo / cột mốc hoạt động gần đây của tác giả */
export interface AuthorRecentNotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  storySlug?: string | null;
  chapterNumber?: number | null;
  createdAt: string;
}

/** Dữ liệu tổng quan Studio của tác giả */
export interface AuthorOverviewData {
  stats: {
    totalStories: number;
    publishedStories: number;
    storiesThisMonth: number;
    totalChapters: number;
    publishedChapters: number;
    chaptersThisMonth: number;
    totalViews: number;
    viewsToday?: number;
    viewsYesterday?: number;
    viewsTodayGrowthPercent?: number;
    viewsWeek?: number;
    viewsWeekGrowthPercent?: number;
    views30Days?: number;
    viewsThisMonth: number;
    viewsGrowthPercent: number;
    totalCoins: number;
    walletBalance: number;
    coinsThisMonth: number;
    coinsGrowthPercent: number;
    totalWords: number;
    totalFollowers: number;
    followersThisMonth: number;
    followersGrowthPercent: number;
    totalComments: number;
    commentsThisMonth: number;
    commentsGrowthPercent: number;
    totalRatings: number;
    ratingsThisMonth: number;
    ratingsGrowthPercent: number;
    ratingAverage: number;
  };
  charts: {
    reads: {
      "7days": AuthorChartSeries;
      "30days": AuthorChartSeries;
      "90days": AuthorChartSeries;
    };
    revenue: {
      "7days": AuthorChartSeries;
      "30days": AuthorChartSeries;
      "90days": AuthorChartSeries;
    };
  };
  recentComments: AuthorRecentCommentItem[];
  recentNotifications: AuthorRecentNotificationItem[];
}
