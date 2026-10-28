import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { Story, StoryDocument, StoryStatus } from '../../stories/schemas/story.schema.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import {
  AdminQueryRatingsDto,
  AdminRatingSortOrder,
  AdminRatingStatusFilter,
} from '../dto/admin-query-ratings.dto.js';
import { CreateRatingDto } from '../dto/create-rating.dto.js';
import { QueryRatingsDto, RatingSortOrder } from '../dto/query-ratings.dto.js';
import {
  StoryRating,
  StoryRatingDocument,
  StoryRatingStatus,
} from '../schemas/story-rating.schema.js';

@Injectable()
export class StoryRatingsService {
  constructor(
    @InjectModel(StoryRating.name)
    private readonly ratingModel: Model<StoryRatingDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tạo mới hoặc cập nhật đánh giá truyện của người dùng (Upsert)
   */
  async rateStory(
    userId: string,
    storyId: string,
    dto: CreateRatingDto,
  ): Promise<StoryRatingDocument> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID truyện không hợp lệ');
    }

    const story = await this.storyModel.findById(storyId).lean();
    if (!story) {
      throw new NotFoundException('Không tìm thấy tác phẩm');
    }

    // Không cho phép tác giả tự đánh giá truyện của chính mình
    if (story.authorId.toString() === userId) {
      throw new BadRequestException(ErrorCode.CANNOT_RATE_OWN_STORY);
    }

    // Chỉ cho phép đánh giá truyện đã được phát hành (PUBLISHED)
    if (story.status !== StoryStatus.PUBLISHED) {
      throw new BadRequestException(ErrorCode.STORY_NOT_PUBLISHED);
    }

    const userObjectId = new Types.ObjectId(userId);
    const storyObjectId = new Types.ObjectId(storyId);

    const rating = await this.ratingModel.findOneAndUpdate(
      { userId: userObjectId, storyId: storyObjectId },
      {
        $set: {
          rating: dto.rating,
          review: dto.review ? dto.review.trim() : '',
          status: StoryRatingStatus.VISIBLE,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Tính toán lại thống kê điểm số và số lượng đánh giá của truyện
    await this.recalculateStoryRating(storyId);

    return rating;
  }

  /**
   * Tính toán lại điểm số trung bình và số lượng đánh giá của truyện
   */
  async recalculateStoryRating(storyId: string): Promise<void> {
    const storyObjectId = new Types.ObjectId(storyId);

    const stats = await this.ratingModel.aggregate([
      {
        $match: {
          storyId: storyObjectId,
          status: StoryRatingStatus.VISIBLE,
        },
      },
      {
        $group: {
          _id: '$storyId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingCount = stats.length > 0 ? stats[0].count : 0;
    const rawAvg = stats.length > 0 ? stats[0].avgRating : 0;
    const ratingAverage = Math.round(rawAvg * 10) / 10;

    await this.storyModel.findByIdAndUpdate(storyObjectId, {
      $set: {
        'stats.ratingCount': ratingCount,
        'stats.ratingAverage': ratingAverage,
      },
    });
  }

  /**
   * Lấy danh sách đánh giá của truyện (phân trang, lọc theo sao, sắp xếp)
   */
  async getStoryRatings(
    storyId: string,
    query: QueryRatingsDto,
  ): Promise<PaginatedResult<any>> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID truyện không hợp lệ');
    }

    const filter: any = {
      storyId: new Types.ObjectId(storyId),
      status: StoryRatingStatus.VISIBLE,
    };

    if (query.rating) {
      filter.rating = query.rating;
    }

    let sort: any = { createdAt: -1 };
    switch (query.sort) {
      case RatingSortOrder.OLDEST:
        sort = { createdAt: 1 };
        break;
      case RatingSortOrder.RATING_DESC:
        sort = { rating: -1, createdAt: -1 };
        break;
      case RatingSortOrder.RATING_ASC:
        sort = { rating: 1, createdAt: -1 };
        break;
      case RatingSortOrder.NEWEST:
      default:
        sort = { createdAt: -1 };
        break;
    }

    const [items, totalItems] = await Promise.all([
      this.ratingModel
        .find(filter)
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .populate('userId', 'displayName username avatarUrl role')
        .lean(),
      this.ratingModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Lấy đánh giá của chính người dùng hiện tại đối với truyện
   */
  async getMyRating(
    userId: string,
    storyId: string,
  ): Promise<StoryRatingDocument | null> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID truyện không hợp lệ');
    }

    return this.ratingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        storyId: new Types.ObjectId(storyId),
        status: { $ne: StoryRatingStatus.DELETED },
      })
      .lean();
  }

  /**
   * Thống kê tổng hợp số sao (tổng số lượt, trung bình, phân bổ 1-5 sao)
   */
  async getRatingSummary(storyId: string) {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID truyện không hợp lệ');
    }

    const storyObjectId = new Types.ObjectId(storyId);

    const breakdownAgg = await this.ratingModel.aggregate([
      {
        $match: {
          storyId: storyObjectId,
          status: StoryRatingStatus.VISIBLE,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalRating = 0;
    let totalCount = 0;

    for (const item of breakdownAgg) {
      const star = Number(item._id);
      const count = Number(item.count);
      if (breakdown[star] !== undefined) {
        breakdown[star] = count;
        totalRating += star * count;
        totalCount += count;
      }
    }

    const ratingAverage =
      totalCount > 0 ? Math.round((totalRating / totalCount) * 10) / 10 : 0;

    return {
      storyId,
      ratingAverage,
      ratingCount: totalCount,
      breakdown,
    };
  }

  /**
   * Người dùng xóa đánh giá của chính mình
   */
  async deleteMyRating(userId: string, storyId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(storyId)) {
      throw new BadRequestException('ID truyện không hợp lệ');
    }

    const rating = await this.ratingModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        storyId: new Types.ObjectId(storyId),
        status: { $ne: StoryRatingStatus.DELETED },
      },
      {
        $set: { status: StoryRatingStatus.DELETED },
      },
    );

    if (!rating) {
      throw new NotFoundException(ErrorCode.RATING_NOT_FOUND);
    }

    await this.recalculateStoryRating(storyId);
    return true;
  }

  /**
   * Admin / Quản lý thay đổi trạng thái đánh giá (VISIBLE, HIDDEN, DELETED)
   */
  async adminUpdateStatus(
    ratingId: string,
    status: StoryRatingStatus,
  ): Promise<StoryRatingDocument> {
    if (!Types.ObjectId.isValid(ratingId)) {
      throw new BadRequestException('ID đánh giá không hợp lệ');
    }

    const rating = await this.ratingModel.findByIdAndUpdate(
      ratingId,
      { $set: { status } },
      { new: true },
    );

    if (!rating) {
      throw new NotFoundException(ErrorCode.RATING_NOT_FOUND);
    }

    await this.recalculateStoryRating(rating.storyId.toString());
    return rating;
  }

  /**
   * [Admin/Manager] Lấy danh sách đánh giá toàn hệ thống
   */
  async adminGetRatings(query: AdminQueryRatingsDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, status, rating, search, storyId, sort } = query;
    const filter: Record<string, any> = {};

    if (status && status !== AdminRatingStatusFilter.ALL) {
      filter.status = status;
    }

    if (rating && rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }

    if (storyId) {
      if (!Types.ObjectId.isValid(storyId)) {
        throw new BadRequestException('ID truyện không hợp lệ');
      }
      filter.storyId = new Types.ObjectId(storyId);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const matchingUsers = await this.userModel
        .find({ $or: [{ displayName: regex }, { username: regex }, { email: regex }] })
        .select('_id')
        .lean();
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { review: regex },
        { userId: { $in: userIds } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === AdminRatingSortOrder.OLDEST) {
      sortOption = { createdAt: 1 };
    } else if (sort === AdminRatingSortOrder.HIGHEST) {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === AdminRatingSortOrder.LOWEST) {
      sortOption = { rating: 1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.ratingModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'displayName username avatarUrl role email')
        .populate('storyId', 'title slug coverUrl authorId')
        .lean(),
      this.ratingModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  /**
   * [Admin/Manager] Thống kê số lượng đánh giá theo trạng thái và điểm trung bình
   */
  async adminGetRatingCounts(): Promise<{
    total: number;
    visible: number;
    hidden: number;
    deleted: number;
    avgRating: number;
  }> {
    const [total, visible, hidden, deleted, stats] = await Promise.all([
      this.ratingModel.countDocuments(),
      this.ratingModel.countDocuments({ status: StoryRatingStatus.VISIBLE }),
      this.ratingModel.countDocuments({ status: StoryRatingStatus.HIDDEN }),
      this.ratingModel.countDocuments({ status: StoryRatingStatus.DELETED }),
      this.ratingModel.aggregate([
        { $match: { status: StoryRatingStatus.VISIBLE } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const rawAvg = stats.length > 0 ? stats[0].avgRating : 0;
    const avgRating = Math.round(rawAvg * 10) / 10;

    return { total, visible, hidden, deleted, avgRating };
  }

  /**
   * [Admin/Manager] Xóa vĩnh viễn đánh giá
   */
  async adminDeleteRating(ratingId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(ratingId)) {
      throw new BadRequestException('ID đánh giá không hợp lệ');
    }

    const rating = await this.ratingModel.findById(ratingId);
    if (!rating) {
      throw new NotFoundException(ErrorCode.RATING_NOT_FOUND);
    }

    const storyId = rating.storyId.toString();
    await this.ratingModel.findByIdAndDelete(ratingId);
    await this.recalculateStoryRating(storyId);

    return true;
  }
}

