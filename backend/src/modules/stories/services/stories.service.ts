import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { AuthorProfile, AuthorProfileDocument } from '../../users/schemas/author-profile.schema.js';
import { CreateStoryDto, StoryAction } from '../dto/create-story.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
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
  constructor(
    @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
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
}
