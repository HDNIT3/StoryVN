import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta } from '../../../common/dto/pagination.dto.js';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';
import { dateRangeMatch, resolveDateRange } from '../../../common/utils/date-range.util.js';
import { ForumPost, ForumPostDocument, ForumPostStatus } from '../../forum/schemas/forum-post.schema.js';
import { Story, StoryDocument, StoryStatus, StoryVisibility } from '../../stories/schemas/story.schema.js';
import { AdminQueryReportsDto, QueryReportsDto, SubmitReportDto } from '../dto/reports.dto.js';
import { ContentReport, ContentReportDocument, ContentReportTargetType } from '../schemas/content-report.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(ContentReport.name) private readonly reports: Model<ContentReportDocument>,
    @InjectModel(ForumPost.name) private readonly posts: Model<ForumPostDocument>,
    @InjectModel(Story.name) private readonly stories: Model<StoryDocument>,
  ) {}

  private objectId(id: string | Types.ObjectId) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid report ID');
    return new Types.ObjectId(id);
  }

  private validateTargetType(targetType: ContentReportTargetType) {
    if (!Object.values(ContentReportTargetType).includes(targetType)) {
      throw new BadRequestException('Invalid report target type');
    }
  }

  async submit(userId: string, dto: SubmitReportDto): Promise<{ reported: true }> {
    this.validateTargetType(dto.targetType);
    const targetId = this.objectId(dto.targetId);
    const reporterId = this.objectId(userId);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    if (!reason || reason.length > 1000) throw new BadRequestException('Reason must contain 1 to 1000 characters');
    const target = dto.targetType === ContentReportTargetType.FORUM_POST
      ? await this.posts.exists({ _id: targetId, status: ForumPostStatus.VISIBLE })
      : await this.stories.exists({ _id: targetId, status: StoryStatus.PUBLISHED, visibility: StoryVisibility.PUBLIC });
    if (!target) throw new NotFoundException('Report target not found');

    try {
      await this.reports.updateOne(
        { targetType: dto.targetType, targetId, userId: reporterId },
        { $setOnInsert: { reason, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, runValidators: true, timestamps: false },
      );
    } catch (error) {
      if ((error as { code?: number })?.code !== 11000) throw error;
    }
    return { reported: true };
  }

  async reportCounts(targetType: ContentReportTargetType, ids: readonly (string | Types.ObjectId)[], query: DateRangeQueryDto = {}): Promise<Map<string, number>> {
    this.validateTargetType(targetType);
    const dateFilter = query.startDate !== undefined || query.endDate !== undefined
      ? dateRangeMatch('createdAt', resolveDateRange(query)) : {};
    if (!ids.length) return new Map();
    const counts = await this.reports.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { targetType, targetId: { $in: ids.map((id) => this.objectId(id)) }, ...dateFilter } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
    return new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
  }

  async listForTarget(targetType: ContentReportTargetType, id: string, query: QueryReportsDto) {
    this.validateTargetType(targetType);
    const targetId = this.objectId(id);
    const target = targetType === ContentReportTargetType.FORUM_POST
      ? await this.posts.exists({ _id: targetId })
      : await this.stories.exists({ _id: targetId });
    if (!target) throw new NotFoundException('Report target not found');
    return this.list(Object.assign(new AdminQueryReportsDto(), query, { targetType, targetId: id }));
  }

  async list(query: AdminQueryReportsDto) {
    const filter: Record<string, unknown> = query.startDate !== undefined || query.endDate !== undefined
      ? dateRangeMatch('createdAt', resolveDateRange(query)) : {};
    if (query.targetType !== undefined) {
      this.validateTargetType(query.targetType);
      filter.targetType = query.targetType;
    }
    if (query.targetId !== undefined) filter.targetId = this.objectId(query.targetId);
    const [items, total] = await Promise.all([
      this.reports.find(filter).select('_id targetType targetId userId reason createdAt updatedAt')
        .sort({ createdAt: -1, _id: -1 }).skip(query.skip).limit(query.limit)
        .populate('userId', '_id username displayName avatarUrl').lean(),
      this.reports.countDocuments(filter),
    ]);
    const { page, limit, totalPages } = buildPaginationMeta(total, query.page, query.limit);
    return { items, pagination: { page, limit, total, totalPages } };
  }
}
