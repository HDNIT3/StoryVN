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
  AuthorProfile,
  AuthorProfileDocument,
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
}
