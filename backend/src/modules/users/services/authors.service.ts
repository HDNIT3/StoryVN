import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { toSlug } from '../../../common/utils/slug.util.js';
import { Genre, GenreDocument } from '../../genres/schemas/genre.schema.js';
import {
  Story,
  StoryDocument,
  StoryProgressState,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
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
    const avatarUrl =
      authorProfile?.avatarUrl || user.avatarUrl || null;
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
        avatarUrl: p.avatarUrl || user?.avatarUrl || null,
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
}

