import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { AuthorProfile, AuthorProfileDocument } from '../../users/schemas/author-profile.schema.js';
import { QueryPublicStoriesDto } from '../dto/query-public-stories.dto.js';
import { RateStoryDto } from '../dto/rate-story.dto.js';
import {
  StoryFollow,
  StoryFollowDocument,
  StoryLike,
  StoryLikeDocument,
  StoryRating,
  StoryRatingDocument,
} from '../schemas/story-interaction.schema.js';
import { Story, StoryDocument, StoryStatus, StoryVisibility } from '../schemas/story.schema.js';

@Injectable()
export class PublicStoriesService {
  private readonly logger = new Logger(PublicStoriesService.name);

  constructor(
    @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
    @InjectModel(StoryLike.name) private readonly likeModel: Model<StoryLikeDocument>,
    @InjectModel(StoryFollow.name) private readonly followModel: Model<StoryFollowDocument>,
    @InjectModel(StoryRating.name) private readonly ratingModel: Model<StoryRatingDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
  ) {}

  /** Bộ lọc cơ bản: chỉ lấy truyện đã xuất bản + visibility PUBLIC */
  private baseFilter() {
    return {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
    };
  }

  /**
   * Lấy danh sách truyện công khai (có lọc, tìm kiếm, sắp xếp, phân trang)
   */
  async getPublicStories(query: QueryPublicStoriesDto): Promise<PaginatedResult<any>> {
    const filter: any = { ...this.baseFilter() };

    if (query.search?.trim()) {
      filter.$or = [
        { title: new RegExp(query.search.trim(), 'i') },
        { slug: new RegExp(query.search.trim(), 'i') },
      ];
    }

    if (query.genre) {
      // cho phép filter theo _id hoặc slug của genre
      if (Types.ObjectId.isValid(query.genre)) {
        filter.genreIds = new Types.ObjectId(query.genre);
      }
    }

    if (query.tag) {
      if (Types.ObjectId.isValid(query.tag)) {
        filter.tagIds = new Types.ObjectId(query.tag);
      }
    }

    if (query.ageRating) filter.ageRating = query.ageRating;
    if (query.progressState) filter.progressState = query.progressState;
    if (query.originType) filter.originType = query.originType;

    const sortFieldMap: Record<string, string> = {
      viewCount: 'stats.viewCount',
      likeCount: 'stats.likeCount',
      followCount: 'stats.followCount',
      ratingAverage: 'stats.ratingAverage',
      chapterCount: 'stats.chapterCount',
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[query.sortBy || 'viewCount'] || 'stats.viewCount';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [items, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .populate('authorId', 'displayName username avatarUrl')
        .populate('genreIds', 'name slug')
        .populate('tagIds', 'name slug')
        .sort({ [sortField]: sortOrder })
        .skip(query.skip)
        .limit(query.limit)
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    const enriched = await this.enrichWithPenNames(items);
    return { items: enriched, pagination: buildPaginationMeta(totalItems, query.page, query.limit) };
  }

  /**
   * Top N truyện theo lượt xem (cho hero banner trang chủ)
   */
  async getTopByViews(limit = 10): Promise<any[]> {
    const items = await this.storyModel
      .find(this.baseFilter())
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .sort({ 'stats.viewCount': -1 })
      .limit(limit)
      .lean()
      .exec();
    return this.enrichWithPenNames(items);
  }

  /**
   * Top N truyện theo lượt like
   */
  async getTopByLikes(limit = 10): Promise<any[]> {
    const items = await this.storyModel
      .find(this.baseFilter())
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .sort({ 'stats.likeCount': -1 })
      .limit(limit)
      .lean()
      .exec();
    return this.enrichWithPenNames(items);
  }

  /**
   * Xem chi tiết 1 truyện công khai (bằng slug hoặc _id)
   */
  async getPublicStoryDetail(slugOrId: string): Promise<any> {
    const isObjectId = Types.ObjectId.isValid(slugOrId);
    const filter: any = isObjectId
      ? { _id: new Types.ObjectId(slugOrId), ...this.baseFilter() }
      : { slug: slugOrId.trim(), ...this.baseFilter() };

    const story = await this.storyModel
      .findOne(filter)
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .lean()
      .exec();

    if (!story) throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);

    const [enriched] = await this.enrichWithPenNames([story]);
    return enriched;
  }

  /**
   * Tăng view (gọi sau khi user ở trang truyện đủ 5 giây)
   */
  async incrementView(storyId: string): Promise<void> {
    if (!Types.ObjectId.isValid(storyId)) return;
    await this.storyModel
      .updateOne(
        { _id: new Types.ObjectId(storyId), status: StoryStatus.PUBLISHED },
        { $inc: { 'stats.viewCount': 1 } },
      )
      .exec();
  }

  /**
   * Toggle like truyện (like / unlike)
   */
  async toggleLike(storyId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    if (!Types.ObjectId.isValid(storyId)) throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    const story = await this.storyModel.findOne({
      _id: new Types.ObjectId(storyId),
      ...this.baseFilter(),
    });
    if (!story) throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);

    const storyOid = new Types.ObjectId(storyId);
    const userOid = new Types.ObjectId(userId);

    const existing = await this.likeModel.findOne({ storyId: storyOid, userId: userOid });
    let liked: boolean;

    if (existing) {
      await this.likeModel.deleteOne({ _id: existing._id });
      await this.storyModel.updateOne({ _id: storyOid }, { $inc: { 'stats.likeCount': -1 } });
      liked = false;
    } else {
      await this.likeModel.create({ storyId: storyOid, userId: userOid });
      await this.storyModel.updateOne({ _id: storyOid }, { $inc: { 'stats.likeCount': 1 } });
      liked = true;
    }

    const updated = await this.storyModel.findById(storyOid).select('stats.likeCount').lean();
    return { liked, likeCount: (updated as any)?.stats?.likeCount ?? 0 };
  }

  /**
   * Toggle follow truyện
   */
  async toggleFollow(storyId: string, userId: string): Promise<{ followed: boolean; followCount: number }> {
    if (!Types.ObjectId.isValid(storyId)) throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    const story = await this.storyModel.findOne({
      _id: new Types.ObjectId(storyId),
      ...this.baseFilter(),
    });
    if (!story) throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);

    const storyOid = new Types.ObjectId(storyId);
    const userOid = new Types.ObjectId(userId);

    const existing = await this.followModel.findOne({ storyId: storyOid, userId: userOid });
    let followed: boolean;

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id });
      await this.storyModel.updateOne({ _id: storyOid }, { $inc: { 'stats.followCount': -1 } });
      followed = false;
    } else {
      await this.followModel.create({ storyId: storyOid, userId: userOid });
      await this.storyModel.updateOne({ _id: storyOid }, { $inc: { 'stats.followCount': 1 } });
      followed = true;
    }

    const updated = await this.storyModel.findById(storyOid).select('stats.followCount').lean();
    return { followed, followCount: (updated as any)?.stats?.followCount ?? 0 };
  }

  /**
   * Đánh giá truyện (upsert)
   */
  async rateStory(storyId: string, userId: string, dto: RateStoryDto): Promise<{ ratingAverage: number; ratingCount: number; myScore: number }> {
    if (!Types.ObjectId.isValid(storyId)) throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    const story = await this.storyModel.findOne({
      _id: new Types.ObjectId(storyId),
      ...this.baseFilter(),
    });
    if (!story) throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);

    const storyOid = new Types.ObjectId(storyId);
    const userOid = new Types.ObjectId(userId);

    await this.ratingModel.findOneAndUpdate(
      { storyId: storyOid, userId: userOid },
      { score: dto.score },
      { upsert: true, new: true },
    );

    // Tính lại ratingAverage & ratingCount từ aggregation
    const agg = await this.ratingModel.aggregate([
      { $match: { storyId: storyOid } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const avg = agg[0]?.avg ?? 0;
    const count = agg[0]?.count ?? 0;

    await this.storyModel.updateOne(
      { _id: storyOid },
      { 'stats.ratingAverage': Math.round(avg * 10) / 10, 'stats.ratingCount': count },
    );

    return { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count, myScore: dto.score };
  }

  /**
   * Lấy trạng thái tương tác của user với truyện (like / follow / rating của mình)
   */
  async getMyInteraction(storyId: string, userId: string): Promise<{ liked: boolean; followed: boolean; myRating: number | null }> {
    if (!Types.ObjectId.isValid(storyId)) return { liked: false, followed: false, myRating: null };

    const storyOid = new Types.ObjectId(storyId);
    const userOid = new Types.ObjectId(userId);

    const [like, follow, rating] = await Promise.all([
      this.likeModel.findOne({ storyId: storyOid, userId: userOid }).lean(),
      this.followModel.findOne({ storyId: storyOid, userId: userOid }).lean(),
      this.ratingModel.findOne({ storyId: storyOid, userId: userOid }).lean(),
    ]);

    return {
      liked: !!like,
      followed: !!follow,
      myRating: rating ? (rating as any).score : null,
    };
  }

  /**
   * Lấy danh sách truyện user đã like
   */
  async getUserLikedStories(userId: string): Promise<any[]> {
    const userOid = new Types.ObjectId(userId);
    const likes = await this.likeModel
      .find({ userId: userOid })
      .sort({ createdAt: -1 })
      .lean();
    if (!likes.length) return [];
    const storyIds = likes.map((l) => l.storyId);
    const items = await this.storyModel
      .find({ _id: { $in: storyIds }, ...this.baseFilter() })
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .lean();
    return this.enrichWithPenNames(items);
  }

  /**
   * Lấy danh sách truyện user đang theo dõi
   */
  async getUserFollowedStories(userId: string): Promise<any[]> {
    const userOid = new Types.ObjectId(userId);
    const follows = await this.followModel
      .find({ userId: userOid })
      .sort({ createdAt: -1 })
      .lean();
    if (!follows.length) return [];
    const storyIds = follows.map((f) => f.storyId);
    const items = await this.storyModel
      .find({ _id: { $in: storyIds }, ...this.baseFilter() })
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .lean();
    return this.enrichWithPenNames(items);
  }

  /**
   * Lấy danh sách truyện user đã đánh giá
   */
  async getUserRatedStories(userId: string): Promise<any[]> {
    const userOid = new Types.ObjectId(userId);
    const ratings = await this.ratingModel
      .find({ userId: userOid })
      .sort({ updatedAt: -1 })
      .lean();
    if (!ratings.length) return [];
    const storyIds = ratings.map((r) => r.storyId);
    const items = await this.storyModel
      .find({ _id: { $in: storyIds }, ...this.baseFilter() })
      .populate('authorId', 'displayName username avatarUrl')
      .populate('genreIds', 'name slug')
      .lean();
    const enriched = await this.enrichWithPenNames(items);
    const ratingMap = new Map(ratings.map((r) => [r.storyId.toString(), r.score]));
    return enriched.map((item) => ({
      ...item,
      userRatingScore: ratingMap.get(item._id.toString()) ?? 0,
    }));
  }

  // ── Helper ──────────────────────────────────────────────────────────────

  private async enrichWithPenNames(items: any[]): Promise<any[]> {
    const authorIds = items.map((item) => item.authorId?._id).filter(Boolean);
    if (!authorIds.length) return items;

    const profiles = await this.authorProfileModel
      .find({ userId: { $in: authorIds } })
      .select('userId penName')
      .lean();

    const profileMap = new Map<string, string>();
    for (const p of profiles) {
      profileMap.set(p.userId.toString(), p.penName);
    }

    return items.map((item) => {
      const uid = item.authorId?._id?.toString();
      const penName = uid ? profileMap.get(uid) : undefined;
      return {
        ...item,
        author: item.authorId
          ? { ...item.authorId, penName: penName || item.authorId.displayName }
          : null,
      };
    });
  }
}
