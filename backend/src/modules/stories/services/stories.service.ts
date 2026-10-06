import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  generateUniqueSlug,
  isSlugAvailable,
  toSlug,
} from '../../../common/utils/slug.util.js';
import { MailService } from '../../mail/mail.service.js';
import { AuthorProfile, AuthorProfileDocument } from '../../users/schemas/author-profile.schema.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { AppealStoryDto } from '../dto/appeal-story.dto.js';
import { CreateStoryDto, StoryAction } from '../dto/create-story.dto.js';
import { QueryAdminStoriesDto } from '../dto/query-admin-stories.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
import { ReviewStoryDto, StoryReviewAction } from '../dto/review-story.dto.js';
import { UpdateStoryDto } from '../dto/update-story.dto.js';
import {
  Story,
  StoryAgeRating,
  StoryDocument,
  StoryOriginType,
  StoryProgressState,
  StoryStatus,
  StoryVisibility,
} from '../schemas/story.schema.js';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async createStory(
    authorId: Types.ObjectId,
    dto: CreateStoryDto,
    actionOverride?: StoryAction,
  ): Promise<StoryDocument> {
    const action = actionOverride || dto.action || StoryAction.DRAFT;
    const status =
      action === StoryAction.SUBMIT
        ? StoryStatus.PENDING_REVIEW
        : StoryStatus.DRAFT;

    const coverUrl = dto.coverImage || dto.coverUrl || null;

    let slug: string;
    if (dto.slug?.trim()) {
      const customSlug = toSlug(dto.slug.trim());
      const available = await isSlugAvailable(this.storyModel, customSlug);
      if (!available) {
        throw new BadRequestException(ErrorCode.STORY_SLUG_EXISTS);
      }
      slug = customSlug;
    } else {
      slug = await generateUniqueSlug(this.storyModel, dto.title, {
        fallback: 'tac-pham',
      });
    }

    const genreIds = (dto.genreIds || []).map((id) => new Types.ObjectId(id));
    const tagIds = (dto.tagIds || []).map((id) => new Types.ObjectId(id));

    const story = new this.storyModel({
      authorId: new Types.ObjectId(authorId),
      title: dto.title.trim(),
      slug,
      description: dto.description?.trim() || '',
      coverUrl,
      genreIds,
      tagIds,
      ageRating: dto.ageRating || StoryAgeRating.ALL,
      progressState: dto.progressState || StoryProgressState.ONGOING,
      originType: dto.originType || StoryOriginType.ORIGINAL,
      status,
      visibility: dto.visibility || StoryVisibility.PUBLIC,
      authorNote: dto.authorNote?.trim() || '',
      stats: {
        viewCount: 0,
        followCount: 0,
        ratingCount: 0,
        ratingAverage: 0,
        chapterCount: 0,
        wordCount: 0,
      },
    });

    const savedStory = await story.save();

    try {
      await this.authorProfileModel.updateOne(
        { userId: new Types.ObjectId(authorId) },
        { $inc: { storyCount: 1 } },
      );
    } catch {
      // ignore
    }

    return (await this.storyModel
      .findById(savedStory._id)
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .exec()) as StoryDocument;
  }

  async getMyStories(
    authorId: Types.ObjectId,
    query: QueryMyStoriesDto,
  ): Promise<PaginatedResult<any>> {
    const filter: any = {
      authorId: new Types.ObjectId(authorId),
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { slug: regex }];
    }

    const sortMap: Record<string, string> = {
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
      title: 'title',
      viewCount: 'stats.viewCount',
      chapterCount: 'stats.chapterCount',
    };

    const sortField = sortMap[query.sortBy || 'updatedAt'] || 'updatedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const [items, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .populate('genreIds', 'name slug')
        .populate('tagIds', 'name slug')
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  async updateMyStory(
    authorId: Types.ObjectId,
    identifier: string,
    dto: UpdateStoryDto,
    actionOverride?: StoryAction,
  ): Promise<StoryDocument> {
    const isObjectId = Types.ObjectId.isValid(identifier);
    const filter: any = isObjectId
      ? { _id: new Types.ObjectId(identifier) }
      : { slug: identifier.trim() };

    const story = await this.storyModel.findOne(filter);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    if (story.authorId.toString() !== authorId.toString()) {
      throw new ForbiddenException(ErrorCode.STORY_FORBIDDEN);
    }

    if (dto.title !== undefined) {
      story.title = dto.title.trim();
    }

    if (dto.slug?.trim()) {
      const customSlug = toSlug(dto.slug.trim());
      const available = await isSlugAvailable(this.storyModel, customSlug, {
        excludeId: story._id,
      });
      if (!available) {
        throw new BadRequestException(ErrorCode.STORY_SLUG_EXISTS);
      }
      story.slug = customSlug;
    }

    if (dto.description !== undefined) {
      story.description = dto.description.trim();
    }

    if (dto.coverImage !== undefined) {
      story.coverUrl = dto.coverImage;
    } else if (dto.coverUrl !== undefined) {
      story.coverUrl = dto.coverUrl;
    }

    if (dto.genreIds !== undefined) {
      story.genreIds = dto.genreIds.map((id) => new Types.ObjectId(id));
    }

    if (dto.tagIds !== undefined) {
      story.tagIds = dto.tagIds.map((id) => new Types.ObjectId(id));
    }

    if (dto.ageRating !== undefined) {
      story.ageRating = dto.ageRating;
    }

    if (dto.progressState !== undefined) {
      story.progressState = dto.progressState;
    }

    if (dto.originType !== undefined) {
      story.originType = dto.originType;
    }

    if (dto.visibility !== undefined) {
      story.visibility = dto.visibility;
    }

    if (dto.authorNote !== undefined) {
      story.authorNote = dto.authorNote.trim();
    }

    const action = actionOverride || dto.action;
    if (action === StoryAction.SUBMIT) {
      story.status = StoryStatus.PENDING_REVIEW;
      story.rejectReason = null;
      story.authorFeedback = null;
      story.appealedAt = null;
    } else if (action === StoryAction.DRAFT) {
      story.status = StoryStatus.DRAFT;
    } else if (dto.status !== undefined) {
      story.status = dto.status;
    }

    await story.save();

    return (await this.storyModel
      .findById(story._id)
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .exec()) as StoryDocument;
  }

  /**
   * Tác giả gửi phản hồi / giải trình khiếu nại khi tác phẩm bị từ chối
   */
  async appealMyStory(
    authorId: Types.ObjectId,
    identifier: string,
    dto: AppealStoryDto,
  ): Promise<any> {
    const isObjectId = Types.ObjectId.isValid(identifier);
    const filter: any = isObjectId
      ? { _id: new Types.ObjectId(identifier) }
      : { slug: identifier.trim() };

    const story = await this.storyModel.findOne(filter);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    if (story.authorId.toString() !== authorId.toString()) {
      throw new ForbiddenException(ErrorCode.STORY_FORBIDDEN);
    }

    if (story.status !== StoryStatus.REJECTED) {
      throw new BadRequestException(ErrorCode.STORY_NOT_REJECTED);
    }

    if (!dto.feedback?.trim()) {
      throw new BadRequestException(ErrorCode.APPEAL_FEEDBACK_REQUIRED);
    }

    story.authorFeedback = dto.feedback.trim();
    story.appealedAt = new Date();
    story.status = StoryStatus.PENDING_REVIEW;

    await story.save();

    return this.storyModel
      .findById(story._id)
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .exec();
  }

  /**
   * Dành cho Manager / Admin: Lấy danh sách tác phẩm (mặc định chờ duyệt, lọc, tìm kiếm, phân trang)
   */
  async getStoriesForAdmin(
    query: QueryAdminStoriesDto,
  ): Promise<PaginatedResult<any>> {
    const filter: any = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    } else if (!query.status) {
      filter.status = StoryStatus.PENDING_REVIEW;
    }

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { slug: regex }];
    }

    if (query.hasAppeal) {
      filter.authorFeedback = { $exists: true, $ne: null };
    }

    const sortMap: Record<string, string> = {
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
      appealedAt: 'appealedAt',
      title: 'title',
    };

    const sortField = sortMap[query.sortBy || 'updatedAt'] || 'updatedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const [rawItems, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .populate('authorId', 'displayName username avatarUrl email')
        .populate('genreIds', 'name slug')
        .populate('tagIds', 'name slug')
        .populate('reviewedBy', 'displayName username')
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    const authorUserIds = rawItems
      .map((item: any) => item.authorId?._id)
      .filter(Boolean);

    const authorProfiles = await this.authorProfileModel
      .find({ userId: { $in: authorUserIds } })
      .select('userId penName')
      .lean()
      .exec();

    const profileMap = new Map<string, string>();
    for (const p of authorProfiles) {
      profileMap.set(p.userId.toString(), p.penName);
    }

    const items = rawItems.map((item: any) => {
      const authorUserId = item.authorId?._id?.toString();
      const penName = authorUserId ? profileMap.get(authorUserId) : undefined;
      return {
        ...item,
        author: item.authorId
          ? {
              ...item.authorId,
              penName: penName || item.authorId.displayName,
            }
          : null,
      };
    });

    return {
      items,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Thống kê số lượng truyện theo từng trạng thái cho dashboard Quản lý
   */
  async getStoryStatsForAdmin(): Promise<{
    total: number;
    pending: number;
    published: number;
    rejected: number;
    appealed: number;
  }> {
    const [total, pending, published, rejected, appealed] = await Promise.all([
      this.storyModel.countDocuments({}),
      this.storyModel.countDocuments({ status: StoryStatus.PENDING_REVIEW }),
      this.storyModel.countDocuments({ status: StoryStatus.PUBLISHED }),
      this.storyModel.countDocuments({ status: StoryStatus.REJECTED }),
      this.storyModel.countDocuments({
        status: StoryStatus.PENDING_REVIEW,
        authorFeedback: { $exists: true, $ne: null },
      }),
    ]);

    return { total, pending, published, rejected, appealed };
  }

  /**
   * Dành cho Manager / Admin: Xem chi tiết tác phẩm để thẩm định nội dung, ảnh bìa, văn án
   */
  async getStoryDetailForAdmin(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel
      .findById(id)
      .populate('authorId', 'displayName username avatarUrl email')
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .populate('reviewedBy', 'displayName username')
      .lean()
      .exec();

    if (!story) {
      // Ngoại lệ 2.a: Tác phẩm không tồn tại hoặc đã bị gỡ
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    let penName = (story.authorId as any)?.displayName;
    let biography = '';
    if (story.authorId?._id) {
      const profile = await this.authorProfileModel
        .findOne({ userId: story.authorId._id })
        .select('penName biography')
        .lean()
        .exec();
      if (profile?.penName) {
        penName = profile.penName;
      }
      if (profile?.biography) {
        biography = profile.biography;
      }
    }

    return {
      ...story,
      author: story.authorId
        ? {
            ...story.authorId,
            penName,
            biography,
          }
        : null,
    };
  }

  /**
   * Dành cho Manager / Admin: Phê duyệt hoặc từ chối tác phẩm kèm lý do
   */
  async reviewStory(
    reviewerId: string,
    id: string,
    dto: ReviewStoryDto,
  ): Promise<{ message: string; story: any }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      // Ngoại lệ 2.a: Tác phẩm đã bị tác giả xóa hoặc gỡ bỏ trước khi phê duyệt
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    if (story.status !== StoryStatus.PENDING_REVIEW) {
      throw new BadRequestException(ErrorCode.STORY_ALREADY_PROCESSED);
    }

    const reviewerObjectId = new Types.ObjectId(reviewerId);
    let message = '';

    if (dto.action === StoryReviewAction.APPROVED) {
      story.status = StoryStatus.PUBLISHED;
      story.rejectReason = null;
      story.reviewedBy = reviewerObjectId;
      story.reviewedAt = new Date();
      if (!story.publishedAt) {
        story.publishedAt = new Date();
      }
      message = 'Phê duyệt tác phẩm thành công';

      await story.save();

      // Gửi email thông báo xuất bản thành công cho tác giả
      this.userModel
        .findById(story.authorId)
        .select('email displayName')
        .lean()
        .exec()
        .then((author) => {
          if (author?.email) {
            this.mailService
              .sendStoryApproved(author.email, author.displayName, story.title)
              .catch((err) =>
                this.logger.error(`Gửi mail duyệt truyện thất bại: ${err.message}`),
              );
          }
        })
        .catch(() => {});
    } else {
      if (!dto.rejectReason?.trim()) {
        throw new BadRequestException(ErrorCode.REJECT_REASON_REQUIRED);
      }

      story.status = StoryStatus.REJECTED;
      story.rejectReason = dto.rejectReason.trim();
      story.reviewedBy = reviewerObjectId;
      story.reviewedAt = new Date();
      message = 'Đã từ chối duyệt tác phẩm và gửi lý do cho tác giả';

      await story.save();

      // Gửi email thông báo từ chối kèm lý do cho tác giả
      this.userModel
        .findById(story.authorId)
        .select('email displayName')
        .lean()
        .exec()
        .then((author) => {
          if (author?.email) {
            this.mailService
              .sendStoryRejected(
                author.email,
                author.displayName,
                story.title,
                story.rejectReason!,
              )
              .catch((err) =>
                this.logger.error(`Gửi mail từ chối truyện thất bại: ${err.message}`),
              );
          }
        })
        .catch(() => {});
    }

    const updatedStory = await this.storyModel
      .findById(story._id)
      .populate('authorId', 'displayName username avatarUrl email')
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .populate('reviewedBy', 'displayName username')
      .lean()
      .exec();

    return { message, story: updatedStory };
  }
}
