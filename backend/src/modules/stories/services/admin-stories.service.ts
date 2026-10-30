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
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { generateUniqueSlug } from '../../../common/utils/slug.util.js';
import {
  getActiveRevision,
  getLatestRevisionWithStatus,
  hasRevisionWithStatus,
  toRevisionView,
  trimRevisions,
} from '../../../common/utils/revision.util.js';
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
    const andConditions: any[] = [];

    if (query.visibility) {
      filter.visibility = query.visibility;
    }

    if (query.genreId && Types.ObjectId.isValid(query.genreId)) {
      filter.genreIds = new Types.ObjectId(query.genreId);
    }

    if (query.status === StoryStatus.PENDING_REVIEW) {
      andConditions.push({
        $or: [
          { status: StoryStatus.PENDING_REVIEW },
          { 'revisions.status': RevisionStatus.PENDING_REVIEW },
        ],
      });
    } else if (query.status === StoryStatus.REJECTED) {
      andConditions.push({
        $or: [
          { status: StoryStatus.REJECTED },
          { 'revisions.status': RevisionStatus.REJECTED },
        ],
      });
    } else if (query.status) {
      filter.status = query.status;
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

      andConditions.push({ $or: orConditions });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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

    const [rawItems, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .select('+revisions')
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

    const items = rawItems.map((item: any) => {
      const activeRevision = getActiveRevision(item.revisions);
      delete item.revisions;
      return {
        ...item,
        pendingRevision: toRevisionView(activeRevision),
        isPendingReview:
          activeRevision?.status === RevisionStatus.PENDING_REVIEW,
      };
    });

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
    const [
      all,
      pending,
      published,
      rejected,
      draft,
      hidden,
    ] = await Promise.all([
      this.storyModel.countDocuments({}),
      this.storyModel.countDocuments({
        $or: [
          { status: StoryStatus.PENDING_REVIEW },
          { 'revisions.status': RevisionStatus.PENDING_REVIEW },
        ],
      }),
      this.storyModel.countDocuments({ status: StoryStatus.PUBLISHED }),
      this.storyModel.countDocuments({
        $or: [
          { status: StoryStatus.REJECTED },
          { 'revisions.status': RevisionStatus.REJECTED },
        ],
      }),
      this.storyModel.countDocuments({ status: StoryStatus.DRAFT }),
      this.storyModel.countDocuments({ visibility: StoryVisibility.PRIVATE }),
    ]);

    return { all, pending, published, rejected, draft, hidden };
  }

  /**
   * Lấy chi tiết tác phẩm theo ID (kèm thông tin tác giả, author profile, thể loại, thẻ)
   */
  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story: any = await this.storyModel
      .findById(id)
      .select('+revisions')
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

    const activeRevision = getActiveRevision(story.revisions);
    delete story.revisions;

    return {
      ...story,
      authorProfile,
      pendingRevision: toRevisionView(activeRevision),
      isPendingReview:
        activeRevision?.status === RevisionStatus.PENDING_REVIEW,
    };
  }

  /**
   * Phê duyệt tác phẩm (chuyển sang PUBLISHED và gửi thông báo)
   */
  async approveStory(id: string, reviewerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const story = await this.storyModel.findById(id).select('+revisions');
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const revisions = (story.revisions || []) as any[];
    const pendingRevision = getLatestRevisionWithStatus(revisions, [
      RevisionStatus.PENDING_REVIEW,
    ]);

    if (pendingRevision) {
      // Duyệt bản chỉnh sửa: ghi đè bản chính thức bằng snapshot
      const snapshot = pendingRevision.snapshot as any;
      if (snapshot.title) {
        const newTitle = snapshot.title.trim();
        if (newTitle && newTitle !== story.title) {
          story.title = newTitle;
          story.slug = await generateUniqueSlug(this.storyModel, newTitle, {
            excludeId: story._id,
            fallback: 'tac-pham',
          });
        }
      }
      story.description = snapshot.description ?? '';
      story.coverUrl = snapshot.coverUrl ?? null;
      story.authorNote = snapshot.authorNote ?? '';
      story.genreIds = (snapshot.genreIds || []).map(
        (gid: any) => new Types.ObjectId(gid),
      );
      story.tagIds = (snapshot.tagIds || []).map(
        (tid: any) => new Types.ObjectId(tid),
      );
      story.ageRating = snapshot.ageRating;

      pendingRevision.status = RevisionStatus.APPROVED;
      pendingRevision.rejectReason = null;
      pendingRevision.updatedAt = new Date();
    } else if (!hasRevisionWithStatus(revisions, RevisionStatus.APPROVED)) {
      // Duyệt lần đầu: tạo mốc bản chính thức
      const now = new Date();
      revisions.push({
        snapshot: {
          title: story.title,
          description: story.description || '',
          coverUrl: story.coverUrl ?? null,
          authorNote: story.authorNote || '',
          genreIds: (story.genreIds || []).map(
            (gid) => new Types.ObjectId(gid),
          ),
          tagIds: (story.tagIds || []).map((tid) => new Types.ObjectId(tid)),
          ageRating: story.ageRating,
        },
        status: RevisionStatus.APPROVED,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    story.status = StoryStatus.PUBLISHED;
    story.rejectReason = null;
    // Không reset publishedAt mỗi lần duyệt lại để giữ ngày xuất bản gốc
    story.publishedAt = story.publishedAt || new Date();

    trimRevisions(revisions);
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

    const story = await this.storyModel.findById(id).select('+revisions');
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto.reason.trim();
    const revisions = (story.revisions || []) as any[];
    const pendingRevision = getLatestRevisionWithStatus(revisions, [
      RevisionStatus.PENDING_REVIEW,
    ]);

    if (pendingRevision) {
      // Chỉ từ chối bản chỉnh sửa; bản chính thức vẫn được giữ nguyên
      pendingRevision.status = RevisionStatus.REJECTED;
      pendingRevision.rejectReason = reason;
      pendingRevision.updatedAt = new Date();
    } else {
      story.status = StoryStatus.REJECTED;
      story.rejectReason = reason;
    }

    await story.save();

    // Gửi thông báo từ chối kèm lý do
    try {
      await this.notificationsService.create({
        userId: story.authorId.toString(),
        type: NotificationType.MODERATION,
        title: '❌ Tác phẩm bị từ chối phê duyệt',
        message: `Tác phẩm "${story.title}" của bạn đã bị từ chối phê duyệt. Lý do: ${reason}`,
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

    const story = await this.storyModel.findById(id).select('+revisions');
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto?.reason?.trim() || null;
    story.status = StoryStatus.DRAFT;
    story.publishedAt = null;
    if (reason) {
      story.rejectReason = reason;
    }

    // Đóng bản chỉnh sửa đang chờ duyệt để tránh trạng thái treo
    for (const revision of (story.revisions || []) as any[]) {
      if (revision.status === RevisionStatus.PENDING_REVIEW) {
        revision.status = RevisionStatus.DRAFT;
        revision.updatedAt = new Date();
      }
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

    const story = await this.storyModel.findById(id).select('+revisions');
    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const reason = dto?.reason?.trim() || null;
    story.visibility = StoryVisibility.PRIVATE;
    if (reason) {
      story.rejectReason = reason;
    }

    // Đóng bản chỉnh sửa đang chờ duyệt khi truyện bị ẩn
    for (const revision of (story.revisions || []) as any[]) {
      if (revision.status === RevisionStatus.PENDING_REVIEW) {
        revision.status = RevisionStatus.DRAFT;
        revision.updatedAt = new Date();
      }
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
    story.rejectReason = null;
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
