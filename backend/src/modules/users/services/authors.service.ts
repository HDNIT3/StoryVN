import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { toSlug } from '../../../common/utils/slug.util.js';
import {
  Chapter,
  ChapterDocument,
  ChapterStatus,
} from '../../chapters/schemas/chapter.schema.js';
import {
  Comment,
  CommentDocument,
  CommentStatus,
} from '../../comments/schemas/comment.schema.js';
import {
  Follow,
  FollowDocument,
  FollowTargetType,
} from '../../follows/schemas/follow.schema.js';
import { Genre, GenreDocument } from '../../genres/schemas/genre.schema.js';
import {
  Notification,
  NotificationDocument,
} from '../../notifications/schemas/notification.schema.js';
import {
  ReadingHistory,
  ReadingHistoryDocument,
} from '../../reading-history/schemas/reading-history.schema.js';
import {
  Story,
  StoryDocument,
  StoryProgressState,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import {
  StoryRating,
  StoryRatingDocument,
  StoryRatingStatus,
} from '../../story-ratings/schemas/story-rating.schema.js';
import { Wallet, WalletDocument } from '../../wallet/schemas/wallet.schema.js';
import {
  AuthorStorySortOption,
  QueryAuthorStoriesDto,
} from '../dto/query-author-stories.dto.js';
import {
  AuthorBioFilter,
  AuthorSortOption,
  QueryAuthorsDto,
} from '../dto/query-authors.dto.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
  AuthorProfileStatus,
} from '../schemas/author-profile.schema.js';
import { User, UserDocument, UserStatus } from '../schemas/user.schema.js';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
    @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
    @InjectModel(Genre.name) private readonly genreModel: Model<GenreDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(ReadingHistory.name)
    private readonly readingHistoryModel: Model<ReadingHistoryDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(StoryRating.name)
    private readonly storyRatingModel: Model<StoryRatingDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
  ) {}

  /**
   * Định danh tác giả thông minh:
   * Chấp nhận Username, Bút danh (penName), Slug của bút danh, hoặc ObjectId
   */
  private async resolveAuthorUser(identifier: string): Promise<any | null> {
    if (!identifier) return null;
    const raw = decodeURIComponent(identifier).trim();
    if (!raw) return null;

    // 1. Kiểm tra ObjectId hợp lệ
    if (Types.ObjectId.isValid(raw)) {
      const objId = new Types.ObjectId(raw);
      const userById = await this.userModel
        .findOne({ _id: objId, status: { $ne: UserStatus.BANNED } })
        .select('_id username displayName avatarUrl role status createdAt')
        .lean()
        .exec();
      if (userById) return userById;

      const profileById = await this.authorProfileModel
        .findById(objId)
        .lean()
        .exec();
      if (profileById?.userId) {
        return this.userModel
          .findOne({ _id: profileById.userId, status: { $ne: UserStatus.BANNED } })
          .select('_id username displayName avatarUrl role status createdAt')
          .lean()
          .exec();
      }
    }

    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 2. Tìm theo User.username
    const userByUsername = await this.userModel
      .findOne({
        username: { $regex: new RegExp(`^${escaped}$`, 'i') },
        status: { $ne: UserStatus.BANNED },
      })
      .select('_id username displayName avatarUrl role status createdAt')
      .lean()
      .exec();
    if (userByUsername) return userByUsername;

    // 3. Tìm theo AuthorProfile.penName (bút danh có dấu hoặc không dấu)
    const profileByPenName = await this.authorProfileModel
      .findOne({
        penName: { $regex: new RegExp(`^${escaped}$`, 'i') },
      })
      .lean()
      .exec();
    if (profileByPenName?.userId) {
      return this.userModel
        .findOne({ _id: profileByPenName.userId, status: { $ne: UserStatus.BANNED } })
        .select('_id username displayName avatarUrl role status createdAt')
        .lean()
        .exec();
    }

    // 4. Tìm theo Slug của bút danh (ví dụ: gõ "nhi-can" -> tìm ra bút danh "Nhĩ Căn", "hdnit" -> "HDNIT")
    const targetSlug = toSlug(raw);
    if (targetSlug) {
      const allProfiles = await this.authorProfileModel.find({}).lean().exec();
      const matchedProfile = allProfiles.find(
        (p) => toSlug(p.penName) === targetSlug,
      );
      if (matchedProfile?.userId) {
        return this.userModel
          .findOne({ _id: matchedProfile.userId, status: { $ne: UserStatus.BANNED } })
          .select('_id username displayName avatarUrl role status createdAt')
          .lean()
          .exec();
      }
    }

    // 5. Tìm theo User.displayName
    const userByDisplayName = await this.userModel
      .findOne({
        displayName: { $regex: new RegExp(`^${escaped}$`, 'i') },
        status: { $ne: UserStatus.BANNED },
      })
      .select('_id username displayName avatarUrl role status createdAt')
      .lean()
      .exec();
    if (userByDisplayName) return userByDisplayName;

    return null;
  }

  /**
   * Lấy thông tin công khai của tác giả theo username, bút danh hoặc slug
   */
  async getAuthorPublicProfile(identifier: string) {
    const user = await this.resolveAuthorUser(identifier);

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tác giả');
    }

    const authorProfile = await this.authorProfileModel
      .findOne({ userId: user._id })
      .lean()
      .exec();

    // Thống kê số lượng tác phẩm công khai theo tiến độ
    const progressCounts = await this.storyModel.aggregate([
      {
        $match: {
          authorId: user._id,
          status: StoryStatus.PUBLISHED,
          visibility: StoryVisibility.PUBLIC,
        },
      },
      {
        $group: {
          _id: '$progressState',
          count: { $sum: 1 },
        },
      },
    ]);

    let ongoingCount = 0;
    let completedCount = 0;
    let onHoldCount = 0;
    let totalPublishedStories = 0;

    progressCounts.forEach((item) => {
      totalPublishedStories += item.count;
      if (item._id === StoryProgressState.ONGOING) ongoingCount = item.count;
      if (item._id === StoryProgressState.COMPLETED) completedCount = item.count;
      if (item._id === StoryProgressState.ON_HOLD) onHoldCount = item.count;
    });

    // Thống kê tổng lượt xem và đánh giá từ toàn bộ tác phẩm đã xuất bản
    const storyStatsAggregate = await this.storyModel.aggregate([
      {
        $match: {
          authorId: user._id,
          status: StoryStatus.PUBLISHED,
          visibility: StoryVisibility.PUBLIC,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$stats.viewCount' },
          totalRatings: { $sum: '$stats.ratingCount' },
          avgRating: { $avg: '$stats.ratingAverage' },
        },
      },
    ]);

    const aggregateResult = storyStatsAggregate[0] || {
      totalViews: 0,
      totalRatings: 0,
      avgRating: 5.0,
    };

    const penName =
      authorProfile?.penName || user.displayName || user.username;
    const avatarUrl = user.avatarUrl || null;
    const coverUrl = authorProfile?.coverUrl || null;
    const biography = authorProfile?.biography || '';
    const website = authorProfile?.website || null;
    const socialLinks = authorProfile?.socialLinks || {};
    const followerCount = authorProfile?.followerCount ?? 0;
    const totalViews =
      authorProfile?.totalViews && authorProfile.totalViews > 0
        ? authorProfile.totalViews
        : aggregateResult.totalViews;
    const storyCount =
      authorProfile?.storyCount && authorProfile.storyCount > 0
        ? authorProfile.storyCount
        : totalPublishedStories;
    const ratingAverage = Number(
      (aggregateResult.avgRating || 5.0).toFixed(1),
    );

    // Thông tin tài khoản ngân hàng để phục vụ độc giả ủng hộ (Donate / Tip)
    const donateInfo = {
      bankName: authorProfile?.bankName || null,
      bankAccountNumber: authorProfile?.bankAccountNumber || null,
      bankAccountName: authorProfile?.bankAccountName || null,
    };

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      penName,
      avatarUrl,
      coverUrl,
      biography,
      website,
      socialLinks,
      followerCount,
      storyCount,
      totalViews,
      ratingAverage,
      counts: {
        all: totalPublishedStories,
        ongoing: ongoingCount,
        completed: completedCount,
        onHold: onHoldCount,
      },
      joinedAt: authorProfile?.createdAt || user.createdAt,
      donateInfo,
    };
  }

  /**
   * Lấy danh sách tác phẩm công khai của tác giả (phân trang + lọc trạng thái + sắp xếp)
   */
  async getAuthorPublicStories(
    identifier: string,
    query: QueryAuthorStoriesDto,
  ): Promise<PaginatedResult<any>> {
    const user = await this.resolveAuthorUser(identifier);

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tác giả');
    }

    const filter: any = {
      authorId: user._id,
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
    };

    if (query.progressState) {
      filter.progressState = query.progressState;
    }

    if (query.search && query.search.trim()) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const sort: any = {};
    switch (query.sortBy) {
      case AuthorStorySortOption.VIEWS:
        sort['stats.viewCount'] = -1;
        sort.updatedAt = -1;
        break;
      case AuthorStorySortOption.RATING:
        sort['stats.ratingAverage'] = -1;
        sort['stats.ratingCount'] = -1;
        break;
      case AuthorStorySortOption.CHAPTERS:
        sort['stats.chapterCount'] = -1;
        sort.updatedAt = -1;
        break;
      case AuthorStorySortOption.LATEST:
      default:
        sort.updatedAt = -1;
        break;
    }

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const [stories, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('genreIds', 'name slug')
        .populate('tagIds', 'name slug')
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    const items = stories.map((s) => ({
      _id: s._id,
      title: s.title,
      slug: s.slug,
      coverUrl: s.coverUrl || null,
      description: s.description || '',
      genres: (s.genreIds as any[]) || [],
      tags: (s.tagIds as any[]) || [],
      ageRating: s.ageRating,
      progressState: s.progressState,
      stats: {
        viewCount: s.stats?.viewCount ?? 0,
        followCount: s.stats?.followCount ?? 0,
        ratingAverage: s.stats?.ratingAverage ?? 0,
        ratingCount: s.stats?.ratingCount ?? 0,
        chapterCount: s.stats?.chapterCount ?? 0,
        wordCount: s.stats?.wordCount ?? 0,
      },
      updatedAt: s.updatedAt,
      publishedAt: s.publishedAt || s.createdAt,
    }));

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * Thống kê cộng đồng sáng tác (Header Stats):
   * - totalAuthors: Số tác giả đã đăng truyện
   * - totalStories: Số tác phẩm đang lưu giữ
   * - totalChapters: Số chương đã xuất bản
   */
  async getCommunityStats() {
    const [publishedAuthorIds, totalStories, chaptersResult] = await Promise.all([
      this.storyModel.distinct('authorId', {
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      }),
      this.storyModel.countDocuments({
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      }),
      this.storyModel.aggregate([
        {
          $match: {
            status: StoryStatus.PUBLISHED,
            visibility: StoryVisibility.PUBLIC,
          },
        },
        {
          $group: {
            _id: null,
            totalChapters: { $sum: '$stats.chapterCount' },
          },
        },
      ]),
    ]);

    const totalChapters = chaptersResult[0]?.totalChapters ?? 0;

    return {
      totalAuthors: publishedAuthorIds.length,
      totalStories,
      totalChapters,
    };
  }

  /**
   * Lấy danh sách tác giả công khai (kèm bộ lọc tìm kiếm, thể loại, tiến độ, tiểu sử, sắp xếp & phân trang)
   */
  async getAuthorsList(query: QueryAuthorsDto): Promise<PaginatedResult<any>> {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
    const skip = (page - 1) * limit;

    // 1. Lọc theo thể loại & trạng thái tiến độ truyện (nếu có)
    let authorIdFilter: Types.ObjectId[] | null = null;

    if (query.genreId) {
      let targetGenreId: Types.ObjectId | null = null;
      if (Types.ObjectId.isValid(query.genreId)) {
        targetGenreId = new Types.ObjectId(query.genreId);
      } else {
        const genre = await this.genreModel
          .findOne({ slug: query.genreId })
          .lean()
          .exec();
        if (genre) targetGenreId = genre._id;
      }

      if (targetGenreId) {
        const ids = await this.storyModel.distinct('authorId', {
          genreIds: targetGenreId,
          status: StoryStatus.PUBLISHED,
          visibility: StoryVisibility.PUBLIC,
        });
        authorIdFilter = ids.map((id: any) => new Types.ObjectId(id));
      } else {
        authorIdFilter = [];
      }
    }

    if (query.progressState) {
      const ids = await this.storyModel.distinct('authorId', {
        progressState: query.progressState,
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      });
      const progressObjectIds = ids.map((id: any) => new Types.ObjectId(id));

      if (authorIdFilter !== null) {
        const idSet = new Set(progressObjectIds.map((id) => id.toString()));
        authorIdFilter = authorIdFilter.filter((id) => idSet.has(id.toString()));
      } else {
        authorIdFilter = progressObjectIds;
      }
    }

    // Nếu đã lọc theo thể loại / tiến độ mà không có tác giả nào phù hợp
    if (authorIdFilter !== null && authorIdFilter.length === 0) {
      return {
        items: [],
        pagination: buildPaginationMeta(0, page, limit),
      };
    }

    // 2. Loại bỏ các tài khoản User bị BANNED
    const bannedUsers = await this.userModel
      .find({ status: UserStatus.BANNED })
      .select('_id')
      .lean()
      .exec();
    const bannedUserIds = bannedUsers.map((u) => u._id);

    // 3. Xây dựng bộ lọc chính trên AuthorProfile
    const profileFilter: any = {
      status: AuthorProfileStatus.ACTIVE,
    };

    if (bannedUserIds.length > 0) {
      profileFilter.userId = { $nin: bannedUserIds };
    }

    if (authorIdFilter !== null) {
      profileFilter.userId = {
        ...(profileFilter.userId || {}),
        $in: authorIdFilter,
      };
    }

    // Lọc theo tiểu sử (hasBio)
    if (query.hasBio === AuthorBioFilter.YES) {
      profileFilter.biography = { $exists: true, $nin: ['', null] };
    } else if (query.hasBio === AuthorBioFilter.NO) {
      profileFilter.$or = [
        { biography: null },
        { biography: '' },
        { biography: { $exists: false } },
      ];
    }

    // Lọc theo từ khóa tìm kiếm (search)
    if (query.search) {
      const rawSearch = decodeURIComponent(query.search).trim();
      if (rawSearch) {
        const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');
        const targetSlug = toSlug(rawSearch);

        const matchedUsers = await this.userModel
          .find({
            $or: [
              { username: { $regex: searchRegex } },
              { displayName: { $regex: searchRegex } },
            ],
            status: { $ne: UserStatus.BANNED },
          })
          .select('_id')
          .lean()
          .exec();

        const matchedUserIds = matchedUsers.map((u) => u._id);

        const searchConditions: any[] = [
          { penName: { $regex: searchRegex } },
        ];
        if (matchedUserIds.length > 0) {
          searchConditions.push({ userId: { $in: matchedUserIds } });
        }

        // Tìm thêm theo slug không dấu nếu người dùng gõ slug (vd: 'nhi-can')
        if (targetSlug) {
          const allProfiles = await this.authorProfileModel
            .find({ status: AuthorProfileStatus.ACTIVE })
            .select('_id penName')
            .lean()
            .exec();
          const slugMatchedIds = allProfiles
            .filter((p) => toSlug(p.penName).includes(targetSlug))
            .map((p) => p._id);
          if (slugMatchedIds.length > 0) {
            searchConditions.push({ _id: { $in: slugMatchedIds } });
          }
        }

        if (profileFilter.$or) {
          profileFilter.$and = [
            { $or: profileFilter.$or },
            { $or: searchConditions },
          ];
          delete profileFilter.$or;
        } else {
          profileFilter.$or = searchConditions;
        }
      }
    }

    // 4. Sắp xếp (Sorting)
    const sort: any = {};
    let customOrderUserIds: string[] | null = null;

    switch (query.sortBy) {
      case AuthorSortOption.NEWEST:
        sort.createdAt = -1;
        break;
      case AuthorSortOption.STORIES:
        sort.storyCount = -1;
        sort.totalViews = -1;
        sort.createdAt = -1;
        break;
      case AuthorSortOption.UPDATED: {
        const recentStories = await this.storyModel.aggregate([
          {
            $match: {
              status: StoryStatus.PUBLISHED,
              visibility: StoryVisibility.PUBLIC,
            },
          },
          { $sort: { updatedAt: -1 } },
          {
            $group: {
              _id: '$authorId',
              latestStoryUpdate: { $first: '$updatedAt' },
            },
          },
          { $sort: { latestStoryUpdate: -1 } },
        ]);
        customOrderUserIds = recentStories.map((r) => r._id.toString());
        sort.updatedAt = -1;
        break;
      }
      case AuthorSortOption.FEATURED:
      default:
        sort.totalViews = -1;
        sort.followerCount = -1;
        sort.storyCount = -1;
        sort.createdAt = -1;
        break;
    }

    let profiles: any[] = [];
    let totalItems = 0;

    if (query.sortBy === AuthorSortOption.UPDATED && customOrderUserIds) {
      const allMatchedProfiles = await this.authorProfileModel
        .find(profileFilter)
        .lean()
        .exec();

      totalItems = allMatchedProfiles.length;

      const orderMap = new Map<string, number>();
      customOrderUserIds.forEach((uid, index) => {
        orderMap.set(uid, index);
      });

      allMatchedProfiles.sort((a, b) => {
        const orderA = orderMap.has(a.userId.toString())
          ? orderMap.get(a.userId.toString())!
          : 999999;
        const orderB = orderMap.has(b.userId.toString())
          ? orderMap.get(b.userId.toString())!
          : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      });

      profiles = allMatchedProfiles.slice(skip, skip + limit);
    } else {
      [profiles, totalItems] = await Promise.all([
        this.authorProfileModel
          .find(profileFilter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.authorProfileModel.countDocuments(profileFilter),
      ]);
    }

    if (profiles.length === 0) {
      return {
        items: [],
        pagination: buildPaginationMeta(totalItems, page, limit),
      };
    }

    // 5. Nạp thông tin User và Top thể loại cho các tác giả ở trang hiện tại
    const targetUserIds = profiles.map((p) => p.userId);

    const [users, stories] = await Promise.all([
      this.userModel
        .find({ _id: { $in: targetUserIds } })
        .select('_id username displayName avatarUrl createdAt')
        .lean()
        .exec(),
      this.storyModel
        .find({
          authorId: { $in: targetUserIds },
          status: StoryStatus.PUBLISHED,
          visibility: StoryVisibility.PUBLIC,
        })
        .select('authorId genreIds updatedAt stats.viewCount stats.chapterCount')
        .populate('genreIds', 'name slug')
        .lean()
        .exec(),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const storiesByAuthor = new Map<string, any[]>();
    stories.forEach((s) => {
      const aId = s.authorId.toString();
      if (!storiesByAuthor.has(aId)) storiesByAuthor.set(aId, []);
      storiesByAuthor.get(aId)!.push(s);
    });

    const items = profiles.map((p) => {
      const user = userMap.get(p.userId.toString());
      const authorStories = storiesByAuthor.get(p.userId.toString()) || [];

      // Tính top thể loại của tác giả
      const genreCounts = new Map<string, { genre: any; count: number }>();
      let latestStoryUpdate: Date | null = null;
      let totalViewsFromStories = 0;

      authorStories.forEach((s) => {
        totalViewsFromStories += s.stats?.viewCount || 0;
        if (s.updatedAt) {
          const sUpdate = new Date(s.updatedAt);
          if (!latestStoryUpdate || sUpdate > latestStoryUpdate) {
            latestStoryUpdate = sUpdate;
          }
        }
        (s.genreIds || []).forEach((g: any) => {
          if (g && g._id) {
            const gId = g._id.toString();
            const existing = genreCounts.get(gId);
            if (existing) {
              existing.count += 1;
            } else {
              genreCounts.set(gId, {
                genre: { _id: g._id, name: g.name, slug: g.slug },
                count: 1,
              });
            }
          }
        });
      });

      const topGenres = Array.from(genreCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((item) => item.genre);

      const effectiveStoryCount =
        p.storyCount && p.storyCount > 0 ? p.storyCount : authorStories.length;
      const effectiveTotalViews =
        p.totalViews && p.totalViews > 0
          ? p.totalViews
          : totalViewsFromStories;

      return {
        _id: p._id,
        userId: user?._id || p.userId,
        username: user?.username || '',
        displayName: user?.displayName || '',
        penName: p.penName || user?.displayName || user?.username || '',
        avatarUrl: user?.avatarUrl || null,
        biography: p.biography || '',
        genres: topGenres,
        followerCount: p.followerCount || 0,
        storyCount: effectiveStoryCount,
        totalViews: effectiveTotalViews,
        joinedAt: p.createdAt || user?.createdAt,
        latestStoryUpdatedAt: latestStoryUpdate || p.updatedAt,
      };
    });

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * Lấy thống kê tổng quan Studio cho tác giả đang đăng nhập:
   * - Số liệu 4 thẻ chính (Tác phẩm, Chương, Lượt đọc, Doanh thu Xu) + tăng trưởng thực tế
   * - Số liệu tương tác thực tế (Đánh giá/Lượt thích, Lượt theo dõi, Bình luận)
   * - Biểu đồ Lượt đọc và Doanh thu Xu theo 7 ngày, 30 ngày, 90 ngày
   * - Bình luận mới nhất trên truyện của tác giả & thông báo gần đây
   */
  async getAuthorOverview(userId: string) {
    const authorObjId = new Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [authorProfile, stories, wallet] = await Promise.all([
      this.authorProfileModel.findOne({ userId: authorObjId }).lean().exec(),
      this.storyModel.find({ authorId: authorObjId }).lean().exec(),
      this.walletModel.findOne({ userId: authorObjId }).lean().exec(),
    ]);

    const storyIds = stories.map((s) => s._id);

    const [
      chapters,
      totalCommentsCount,
      commentsThisMonthCount,
      commentsPrevMonthCount,
      totalRatingsCount,
      ratingsThisMonthCount,
      ratingsPrevMonthCount,
      followsThisMonthCount,
      followsPrevMonthCount,
      recentCommentsRaw,
      recentNotificationsRaw,
    ] = await Promise.all([
      storyIds.length > 0
        ? this.chapterModel
            .find({ storyId: { $in: storyIds } })
            .select(
              '_id storyId chapterNumber title status isFree coinPrice viewCount wordCount updatedAt createdAt',
            )
            .lean()
            .exec()
        : Promise.resolve([]),
      storyIds.length > 0
        ? this.commentModel.countDocuments({
            storyId: { $in: storyIds },
            status: CommentStatus.VISIBLE,
          })
        : Promise.resolve(0),
      storyIds.length > 0
        ? this.commentModel.countDocuments({
            storyId: { $in: storyIds },
            status: CommentStatus.VISIBLE,
            createdAt: { $gte: startOfMonth },
          })
        : Promise.resolve(0),
      storyIds.length > 0
        ? this.commentModel.countDocuments({
            storyId: { $in: storyIds },
            status: CommentStatus.VISIBLE,
            createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
          })
        : Promise.resolve(0),
      storyIds.length > 0
        ? this.storyRatingModel.countDocuments({
            storyId: { $in: storyIds },
            status: StoryRatingStatus.VISIBLE,
          })
        : Promise.resolve(0),
      storyIds.length > 0
        ? this.storyRatingModel.countDocuments({
            storyId: { $in: storyIds },
            status: StoryRatingStatus.VISIBLE,
            createdAt: { $gte: startOfMonth },
          })
        : Promise.resolve(0),
      storyIds.length > 0
        ? this.storyRatingModel.countDocuments({
            storyId: { $in: storyIds },
            status: StoryRatingStatus.VISIBLE,
            createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
          })
        : Promise.resolve(0),
      this.followModel.countDocuments({
        $or: [
          { targetType: FollowTargetType.AUTHOR, targetId: authorObjId },
          ...(storyIds.length > 0
            ? [{ targetType: FollowTargetType.STORY, targetId: { $in: storyIds } }]
            : []),
        ],
        createdAt: { $gte: startOfMonth },
      }),
      this.followModel.countDocuments({
        $or: [
          { targetType: FollowTargetType.AUTHOR, targetId: authorObjId },
          ...(storyIds.length > 0
            ? [{ targetType: FollowTargetType.STORY, targetId: { $in: storyIds } }]
            : []),
        ],
        createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
      }),
      storyIds.length > 0
        ? this.commentModel
            .find({
              storyId: { $in: storyIds },
              status: CommentStatus.VISIBLE,
            })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('userId', 'username displayName avatarUrl')
            .populate('storyId', 'title slug')
            .populate('chapterId', 'chapterNumber title')
            .lean()
            .exec()
        : Promise.resolve([]),
      this.notificationModel
        .find({ userId: authorObjId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('storyId', 'title slug')
        .populate('chapterId', 'chapterNumber title')
        .lean()
        .exec(),
    ]);

    const calcGrowthPercent = (curr: number, prev: number): number => {
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    // 1. Thống kê tổng quan
    const totalStories = stories.length;
    const publishedStories = stories.filter(
      (s) => s.status === StoryStatus.PUBLISHED,
    ).length;
    const storiesThisMonth = stories.filter(
      (s) => s.createdAt && new Date(s.createdAt) >= startOfMonth,
    ).length;

    const chaptersFromStories = stories.reduce(
      (sum, s) => sum + (s.stats?.chapterCount || 0),
      0,
    );
    const totalChapters = Math.max(chapters.length, chaptersFromStories);
    const publishedChapters = chapters.filter(
      (c) => c.status === ChapterStatus.PUBLISHED,
    ).length;
    const chaptersThisMonth = chapters.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= startOfMonth,
    ).length;

    const viewsFromStories = stories.reduce(
      (sum, s) => sum + (s.stats?.viewCount || 0),
      0,
    );
    const viewsFromChapters = chapters.reduce(
      (sum, c) => sum + (c.viewCount || 0),
      0,
    );
    const totalViews = Math.max(
      viewsFromStories,
      viewsFromChapters,
      authorProfile?.totalViews || 0,
    );

    const wordsFromStories = stories.reduce(
      (sum, s) => sum + (s.stats?.wordCount || 0),
      0,
    );
    const wordsFromChapters = chapters.reduce(
      (sum, c) => sum + (c.wordCount || 0),
      0,
    );
    const totalWords = Math.max(wordsFromStories, wordsFromChapters);

    const storyFollowsSum = stories.reduce(
      (sum, s) => sum + (s.stats?.followCount || 0),
      0,
    );
    const totalFollowers = (authorProfile?.followerCount || 0) + storyFollowsSum;

    const storyRatingsSum = stories.reduce(
      (sum, s) => sum + (s.stats?.ratingCount || 0),
      0,
    );
    const effectiveRatingsCount = Math.max(totalRatingsCount, storyRatingsSum);

    const ratedStories = stories.filter((s) => (s.stats?.ratingCount || 0) > 0);
    const ratingAverage =
      ratedStories.length > 0
        ? Number(
            (
              ratedStories.reduce(
                (sum, s) => sum + (s.stats?.ratingAverage || 0),
                0,
              ) / ratedStories.length
            ).toFixed(1),
          )
        : 0;

    // 2. Xây dựng chuỗi thời gian 180 ngày (90 ngày hiện tại + 90 ngày kỳ trước)
    const toDateKey = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toDateLabel = (d: Date): string => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    const start180DaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 179,
    );

    const dailyMap = new Map<
      string,
      { date: string; label: string; reads: number; coins: number }
    >();

    for (let i = 179; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = toDateKey(d);
      dailyMap.set(key, {
        date: key,
        label: toDateLabel(d),
        reads: 0,
        coins: 0,
      });
    }

    const chapterMap = new Map<string, any>();
    chapters.forEach((ch) => {
      chapterMap.set(ch._id.toString(), ch);
    });

    const readingLogs =
      storyIds.length > 0
        ? await this.readingHistoryModel
            .find({
              storyId: { $in: storyIds },
            })
            .select('storyId chapterId readAt updatedAt createdAt')
            .lean()
            .exec()
        : [];

    const loggedReadsByChapter = new Map<string, number>();

    readingLogs.forEach((log: any) => {
      const chId = log.chapterId ? log.chapterId.toString() : '';
      if (chId) {
        loggedReadsByChapter.set(chId, (loggedReadsByChapter.get(chId) || 0) + 1);
      }

      const rawDate = log.readAt || log.updatedAt || log.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (d < start180DaysAgo) return;

      const key = toDateKey(d);
      const bucket = dailyMap.get(key);
      if (bucket) {
        bucket.reads += 1;
        const ch = chId ? chapterMap.get(chId) : null;
        if (ch && !ch.isFree && (ch.coinPrice || 0) > 0) {
          bucket.coins += ch.coinPrice || 0;
        }
      }
    });

    // Cộng phần lượt đọc khách (guest views trên chapter.viewCount chưa nằm trong ReadingHistory)
    let totalPaidChapterCoins = 0;

    chapters.forEach((ch) => {
      const chId = ch._id.toString();
      const chViews = ch.viewCount || 0;
      const coinPrice = !ch.isFree && (ch.coinPrice || 0) > 0 ? ch.coinPrice : 0;

      if (coinPrice > 0 && chViews > 0) {
        totalPaidChapterCoins += chViews * coinPrice;
      }

      const loggedCount = loggedReadsByChapter.get(chId) || 0;
      const unloggedViews = Math.max(0, chViews - loggedCount);

      if (unloggedViews > 0) {
        const refDate = new Date(ch.updatedAt || ch.createdAt || now);
        const key = toDateKey(refDate);
        const bucket = dailyMap.get(key);
        if (bucket) {
          bucket.reads += unloggedViews;
          if (coinPrice > 0) {
            bucket.coins += unloggedViews * coinPrice;
          }
        }
      }
    });

    // Nếu tổng lượt xem cấp truyện lớn hơn tổng lượt xem các chương, gán phần chênh lệch vào ngày cập nhật của truyện
    const unattributedStoryViews = Math.max(0, totalViews - viewsFromChapters);
    if (unattributedStoryViews > 0 && stories.length > 0) {
      stories.forEach((s) => {
        const sViews = s.stats?.viewCount || 0;
        const sChaptersViews = chapters
          .filter((c) => c.storyId.toString() === s._id.toString())
          .reduce((sum, c) => sum + (c.viewCount || 0), 0);
        const diff = Math.max(0, sViews - sChaptersViews);
        if (diff > 0) {
          const refDate = new Date(s.updatedAt || s.publishedAt || s.createdAt || now);
          const key = toDateKey(refDate);
          const bucket = dailyMap.get(key);
          if (bucket) {
            bucket.reads += diff;
          }
        }
      });
    }

    const all180Days = Array.from(dailyMap.values());
    const last90Days = all180Days.slice(-90);
    const prev90Days = all180Days.slice(0, 90);
    const last30Days = last90Days.slice(-30);
    const prev30Days = all180Days.slice(-60, -30);
    const last7Days = last90Days.slice(-7);
    const prev7Days = last90Days.slice(-14, -7);

    const sumReads = (arr: typeof all180Days) =>
      arr.reduce((sum, item) => sum + item.reads, 0);
    const sumCoins = (arr: typeof all180Days) =>
      arr.reduce((sum, item) => sum + item.coins, 0);

    const reads7Total = sumReads(last7Days);
    const reads7Prev = sumReads(prev7Days);
    const reads30Total = sumReads(last30Days);
    const reads30Prev = sumReads(prev30Days);
    const reads90Total = sumReads(last90Days);
    const reads90Prev = sumReads(prev90Days);

    const coins7Total = sumCoins(last7Days);
    const coins7Prev = sumCoins(prev7Days);
    const coins30Total = sumCoins(last30Days);
    const coins30Prev = sumCoins(prev30Days);
    const coins90Total = sumCoins(last90Days);
    const coins90Prev = sumCoins(prev90Days);

    // Lượt đọc & xu trong tháng hiện tại (từ ngày 01 tháng này)
    const startOfMonthKey = toDateKey(startOfMonth);
    const startOfPrevMonthKey = toDateKey(startOfPrevMonth);

    const currentMonthBuckets = all180Days.filter(
      (item) => item.date >= startOfMonthKey,
    );
    const prevMonthBuckets = all180Days.filter(
      (item) => item.date >= startOfPrevMonthKey && item.date < startOfMonthKey,
    );

    const viewsThisMonth = sumReads(currentMonthBuckets);
    const viewsPrevMonth = sumReads(prevMonthBuckets);
    const viewsGrowthPercent = calcGrowthPercent(viewsThisMonth, viewsPrevMonth);

    const coinsThisMonth = sumCoins(currentMonthBuckets);
    const coinsPrevMonth = sumCoins(prevMonthBuckets);
    const coinsGrowthPercent = calcGrowthPercent(coinsThisMonth, coinsPrevMonth);

    const totalCoins = totalPaidChapterCoins;
    const walletBalance = wallet?.balance ?? 0;

    // 3. Định dạng danh sách bình luận mới nhất
    const recentComments = recentCommentsRaw.map((c: any) => {
      const commenter = c.userId && typeof c.userId === 'object' ? c.userId : null;
      const storyObj = c.storyId && typeof c.storyId === 'object' ? c.storyId : null;
      const chapterObj =
        c.chapterId && typeof c.chapterId === 'object' ? c.chapterId : null;

      return {
        _id: c._id.toString(),
        user: {
          displayName:
            commenter?.displayName || commenter?.username || 'Độc giả StoryVN',
          username: commenter?.username || '',
          avatarUrl: commenter?.avatarUrl || null,
        },
        story: storyObj
          ? {
              _id: storyObj._id?.toString(),
              title: storyObj.title || 'Tác phẩm',
              slug: storyObj.slug || '',
            }
          : null,
        chapter: chapterObj
          ? {
              _id: chapterObj._id?.toString(),
              chapterNumber: chapterObj.chapterNumber,
              title: chapterObj.title || '',
            }
          : null,
        content: c.content || '',
        likeCount: c.likeCount || 0,
        createdAt: c.createdAt,
      };
    });

    // 4. Định dạng thông báo hệ thống gần đây (nếu chưa có bản ghi Notification thì tổng hợp từ hoạt động thật của tác giả)
    let recentNotifications = recentNotificationsRaw.map((n: any) => {
      const storyObj = n.storyId && typeof n.storyId === 'object' ? n.storyId : null;
      const chapterObj =
        n.chapterId && typeof n.chapterId === 'object' ? n.chapterId : null;

      return {
        _id: n._id.toString(),
        type: n.type || 'SYSTEM',
        title: n.title || 'Thông báo hệ thống',
        message: n.message || '',
        isRead: Boolean(n.isRead),
        storySlug: storyObj?.slug || null,
        chapterNumber: chapterObj?.chapterNumber ?? null,
        createdAt: n.createdAt,
      };
    });

    if (recentNotifications.length === 0 && stories.length > 0) {
      const synthesized: typeof recentNotifications = [];

      const sortedStories = [...stories].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      );

      sortedStories.slice(0, 3).forEach((s) => {
        synthesized.push({
          _id: `story-${s._id.toString()}`,
          type: 'STORY_MILESTONE',
          title:
            s.status === StoryStatus.PUBLISHED
              ? `Tác phẩm "${s.title}" đang phát hành`
              : `Bản thảo "${s.title}" đã được lưu`,
          message: `${(s.stats?.viewCount || 0).toLocaleString('vi-VN')} lượt đọc • ${s.stats?.chapterCount || 0} chương • ${s.stats?.followCount || 0} theo dõi`,
          isRead: true,
          storySlug: s.slug || null,
          chapterNumber: null,
          createdAt: s.updatedAt || s.createdAt || now,
        });
      });

      const sortedChapters = [...chapters]
        .filter((c) => c.status === ChapterStatus.PUBLISHED)
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime(),
        );

      const storySlugById = new Map(
        stories.map((s) => [s._id.toString(), { title: s.title, slug: s.slug }]),
      );

      sortedChapters.slice(0, 3).forEach((ch) => {
        const st = storySlugById.get(ch.storyId.toString());
        synthesized.push({
          _id: `chapter-${ch._id.toString()}`,
          type: 'NEW_CHAPTER',
          title: `Đã xuất bản Chương ${ch.chapterNumber}: ${ch.title}`,
          message: st
            ? `Thuộc tác phẩm "${st.title}" • ${(ch.viewCount || 0).toLocaleString('vi-VN')} lượt đọc`
            : `${(ch.viewCount || 0).toLocaleString('vi-VN')} lượt đọc`,
          isRead: true,
          storySlug: st?.slug || null,
          chapterNumber: ch.chapterNumber,
          createdAt: ch.updatedAt || ch.createdAt || now,
        });
      });

      recentNotifications = synthesized
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 5);
    }

    return {
      stats: {
        totalStories,
        publishedStories,
        storiesThisMonth,
        totalChapters,
        publishedChapters,
        chaptersThisMonth,
        totalViews,
        viewsThisMonth,
        viewsGrowthPercent,
        totalCoins,
        walletBalance,
        coinsThisMonth,
        coinsGrowthPercent,
        totalWords,
        totalFollowers,
        followersThisMonth: followsThisMonthCount,
        followersGrowthPercent: calcGrowthPercent(
          followsThisMonthCount,
          followsPrevMonthCount,
        ),
        totalComments: totalCommentsCount,
        commentsThisMonth: commentsThisMonthCount,
        commentsGrowthPercent: calcGrowthPercent(
          commentsThisMonthCount,
          commentsPrevMonthCount,
        ),
        totalRatings: effectiveRatingsCount,
        ratingsThisMonth: ratingsThisMonthCount,
        ratingsGrowthPercent: calcGrowthPercent(
          ratingsThisMonthCount,
          ratingsPrevMonthCount,
        ),
        ratingAverage,
      },
      charts: {
        reads: {
          '7days': {
            items: last7Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.reads,
            })),
            total: reads7Total,
            growthPercent: calcGrowthPercent(reads7Total, reads7Prev),
          },
          '30days': {
            items: last30Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.reads,
            })),
            total: reads30Total,
            growthPercent: calcGrowthPercent(reads30Total, reads30Prev),
          },
          '90days': {
            items: last90Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.reads,
            })),
            total: reads90Total,
            growthPercent: calcGrowthPercent(reads90Total, reads90Prev),
          },
        },
        revenue: {
          '7days': {
            items: last7Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.coins,
            })),
            total: coins7Total,
            growthPercent: calcGrowthPercent(coins7Total, coins7Prev),
          },
          '30days': {
            items: last30Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.coins,
            })),
            total: coins30Total,
            growthPercent: calcGrowthPercent(coins30Total, coins30Prev),
          },
          '90days': {
            items: last90Days.map((d) => ({
              date: d.date,
              label: d.label,
              value: d.coins,
            })),
            total: coins90Total,
            growthPercent: calcGrowthPercent(coins90Total, coins90Prev),
          },
        },
      },
      recentComments,
      recentNotifications,
    };
  }
}

