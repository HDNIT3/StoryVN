import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/schemas/notification.schema.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
} from '../../users/schemas/author-profile.schema.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { AdminModerationReasonDto } from '../dto/admin-moderation-reason.dto.js';
import { AdminQueryStoriesDto } from '../dto/admin-query-stories.dto.js';
import { AdminRejectStoryDto } from '../dto/admin-reject-story.dto.js';
import {
  Story,
  StoryDocument,
  StoryStatus,
  StoryVisibility,
} from '../schemas/story.schema.js';

@Injectable()
export class AdminStoriesService {
  constructor(
    @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Lấy danh sách truyện trong admin (lọc theo trạng thái, hiển thị công khai/riêng tư, thể loại, từ khóa, sắp xếp, phân trang)
   */
  async findAll(query: AdminQueryStoriesDto): Promise<PaginatedResult<any>> {
    const filter: Record<string, any> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.visibility) {
      filter.visibility = query.visibility;
    }

    if (query.genreId && Types.ObjectId.isValid(query.genreId)) {
      filter.genreIds = new Types.ObjectId(query.genreId);
    }

    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');

      const matchedUsers = await this.userModel
        .find({
          $or: [
            { username: searchRegex },
            { displayName: searchRegex },
            { email: searchRegex },
          ],
        })
        .select('_id')
        .lean()
        .exec();

      const matchedUserIds = matchedUsers.map((u) => u._id);

      const orConditions: any[] = [
        { title: searchRegex },
        { slug: searchRegex },
      ];

      if (matchedUserIds.length > 0) {
        orConditions.push({ authorId: { $in: matchedUserIds } });
      }

      filter.$or = orConditions;
    }

    const sortMap: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      title: 'title',
      viewCount: 'stats.viewCount',
      chapterCount: 'stats.chapterCount',
    };

    const sortField = sortMap[query.sortBy || 'createdAt'] || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const [items, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .populate('authorId', 'displayName username email avatarUrl role')
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

  /**
   * Lấy số lượng thống kê truyện theo từng tab (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Bản nháp, Bị ẩn/riêng tư)
   */
  async getCounts(): Promise<{
    all: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
    hidden: number;
  }> {
    const [statusAggregate, hiddenCount] = await Promise.all([
      this.storyModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.storyModel.countDocuments({ visibility: StoryVisibility.PRIVATE }),
    ]);

    const counts = {
      all: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      draft: 0,
      hidden: hiddenCount,
    };

    statusAggregate.forEach((item) => {
      counts.all += item.count;
      if (item._id === StoryStatus.PENDING_REVIEW) {
        counts.pending = item.count;
      } else if (item._id === StoryStatus.PUBLISHED) {
        counts.published = item.count;
      } else if (item._id === StoryStatus.REJECTED) {
        counts.rejected = item.count;
      } else if (item._id === StoryStatus.DRAFT) {
        counts.draft = item.count;
      }
    });

    return counts;
  }

  /**
   * Lấy chi tiết tác phẩm theo ID (kèm thông tin tác giả, author profile, thể loại, thẻ)
   */
  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel
      .findById(id)
      .populate('authorId', 'displayName username email avatarUrl role createdAt')
      .populate('genreIds', 'name slug description')
      .populate('tagIds', 'name slug')
      .lean()
      .exec();

    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    let authorProfile: any = null;
    if (story.authorId && (story.authorId as any)._id) {
      authorProfile = await this.authorProfileModel
        .findOne({ userId: (story.authorId as any)._id })
        .lean()
        .exec();
    }

    return {
      ...story,
      authorProfile,
    };
  }

  /**
   * Phê duyệt tác phẩm (chuyển sang PUBLISHED và gửi thông báo)
   */
  async approveStory(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    story.status = StoryStatus.PUBLISHED;
    story.rejectReason = null;
    story.publishedAt = new Date();
    await story.save();

    // Gửi thông báo tới tác giả bằng hàm create có sẵn của NotificationsService
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '🎉 Tác phẩm đã được phê duyệt!',
        message: `Chúc mừng! Tác phẩm "${story.title}" của bạn đã được ban quản trị phê duyệt và chính thức xuất bản trên hệ thống.`,
        storyId: story._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // bỏ qua nếu lỗi gửi thông báo
    }

    return {
      message: 'Phê duyệt tác phẩm thành công',
      story: await this.findById(story._id.toString()),
    };
  }

  /**
   * Từ chối duyệt tác phẩm kèm lý do (chuyển sang REJECTED và gửi thông báo)
   */
  async rejectStory(
    id: string,
    reviewerId: string,
    dto: AdminRejectStoryDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    story.status = StoryStatus.REJECTED;
    story.rejectReason = dto.reason.trim();
    await story.save();

    // Gửi thông báo từ chối kèm lý do
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '❌ Tác phẩm bị từ chối phê duyệt',
        message: `Tác phẩm "${story.title}" của bạn đã bị từ chối phê duyệt. Lý do: ${dto.reason.trim()}`,
        storyId: story._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // bỏ qua
    }

    return {
      message: 'Đã từ chối phê duyệt tác phẩm',
      story: await this.findById(story._id.toString()),
    };
  }

  /**
   * Gỡ duyệt tác phẩm (chuyển trạng thái từ PUBLISHED về DRAFT và gửi thông báo)
   */
  async unpublishStory(
    id: string,
    reviewerId: string,
    dto?: AdminModerationReasonDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto?.reason?.trim() || null;
    story.status = StoryStatus.DRAFT;
    story.publishedAt = null;
    if (reason) {
      story.rejectReason = reason;
    }
    await story.save();

    // Gửi thông báo gỡ duyệt
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '⚠️ Tác phẩm đã bị gỡ duyệt',
        message: `Tác phẩm "${story.title}" của bạn đã bị gỡ khỏi trạng thái xuất bản (chuyển về bản nháp).${
          reason ? ` Lý do: ${reason}` : ''
        }`,
        storyId: story._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // bỏ qua
    }

    return {
      message: 'Đã gỡ duyệt tác phẩm thành công (chuyển về bản nháp)',
      story: await this.findById(story._id.toString()),
    };
  }

  /**
   * Cấm / Ẩn tác phẩm khỏi chế độ công khai (chuyển visibility sang PRIVATE và gửi thông báo)
   */
  async hideStory(
    id: string,
    reviewerId: string,
    dto?: AdminModerationReasonDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto?.reason?.trim() || null;
    story.visibility = StoryVisibility.PRIVATE;
    if (reason) {
      story.rejectReason = reason;
    }
    await story.save();

    // Gửi thông báo ẩn công khai
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '🚫 Tác phẩm đã bị ẩn công khai',
        message: `Tác phẩm "${story.title}" của bạn đã bị ban quản trị ẩn khỏi chế độ công khai.${
          reason ? ` Lý do: ${reason}` : ''
        }`,
        storyId: story._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // bỏ qua
    }

    return {
      message: 'Đã cấm/ẩn tác phẩm khỏi chế độ công khai',
      story: await this.findById(story._id.toString()),
    };
  }

  /**
   * Mở lại hiển thị công khai cho tác phẩm (chuyển visibility sang PUBLIC và gửi thông báo)
   */
  async unhideStory(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id);
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    story.visibility = StoryVisibility.PUBLIC;
    await story.save();

    // Gửi thông báo mở lại công khai
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '✅ Tác phẩm đã được mở lại công khai',
        message: `Tác phẩm "${story.title}" của bạn đã được ban quản trị khôi phục hiển thị công khai.`,
        storyId: story._id.toString(),
        actorId: reviewerId,
      });
    } catch {
      // bỏ qua
    }

    return {
      message: 'Đã mở lại chế độ hiển thị công khai cho tác phẩm',
      story: await this.findById(story._id.toString()),
    };
  }
}
