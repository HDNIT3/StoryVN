import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
} from '../../users/schemas/author-profile.schema.js';
import {
  User,
  UserDocument,
  UserStatus,
} from '../../users/schemas/user.schema.js';
import {
  Story,
  StoryDocument,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import {
  FollowStorySortOption,
  QueryFollowedAuthorsDto,
  QueryFollowedStoriesDto,
} from '../dto/query-follows.dto.js';
import {
  Follow,
  FollowDocument,
  FollowTargetType,
} from '../schemas/follow.schema.js';

export interface ToggleFollowResult {
  isFollowing: boolean;
  targetType: FollowTargetType;
  targetId: string;
}

export interface FollowedStoryItem {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    penName: string;
    avatarUrl: string | null;
  } | null;
  stats: {
    viewCount: number;
    followCount: number;
    chapterCount: number;
    ratingAverage: number;
  };
  progressState: string;
  updatedAt: Date;
  followedAt: Date;
}

export interface FollowedAuthorItem {
  _id: string;
  username: string;
  displayName: string;
  penName: string;
  avatarUrl: string | null;
  biography: string;
  followerCount: number;
  storyCount: number;
  totalViews: number;
  followedAt: Date;
}

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthorProfile.name)
    private readonly authorProfileModel: Model<AuthorProfileDocument>,
  ) {}

  async toggleFollow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    await this.validateTarget(userId, targetType, targetObjectId);

    const existing = await this.followModel
      .findOne({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .lean()
      .exec();

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id }).exec();
      await this.decrementCounter(targetType, targetObjectId);
      return { isFollowing: false, targetType, targetId };
    }

    try {
      await this.followModel.create({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        await this.followModel
          .deleteOne({
            userId: userObjectId,
            targetType,
            targetId: targetObjectId,
          })
          .exec();
        await this.decrementCounter(targetType, targetObjectId);
        return { isFollowing: false, targetType, targetId };
      }
      throw err;
    }

    await this.incrementCounter(targetType, targetObjectId);

    return { isFollowing: true, targetType, targetId };
  }

  async follow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    await this.validateTarget(userId, targetType, targetObjectId);

    try {
      await this.followModel.create({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      });
      await this.incrementCounter(targetType, targetObjectId);
    } catch (err: any) {
      if (err?.code === 11000) {
        return { isFollowing: true, targetType, targetId };
      }
      throw err;
    }

    return { isFollowing: true, targetType, targetId };
  }

  async unfollow(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<ToggleFollowResult> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    const result = await this.followModel
      .deleteOne({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .exec();

    if (result.deletedCount > 0) {
      await this.decrementCounter(targetType, targetObjectId);
    }

    return { isFollowing: false, targetType, targetId };
  }

  async checkFollowStatus(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<{ isFollowing: boolean }> {
    const userObjectId = this.toObjectId(userId);
    const targetObjectId = this.toObjectId(targetId);

    const exists = await this.followModel
      .exists({
        userId: userObjectId,
        targetType,
        targetId: targetObjectId,
      })
      .exec();

    return { isFollowing: !!exists };
  }

  async checkBatchStatus(
    userId: string,
    targetType: FollowTargetType,
    targetIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!targetIds.length) return {};

    const userObjectId = this.toObjectId(userId);
    const objectIds = targetIds.map((id) => this.toObjectId(id));

    const followedDocs = await this.followModel
      .find({
        userId: userObjectId,
        targetType,
        targetId: { $in: objectIds },
      })
      .select('targetId')
      .lean()
      .exec();

    const followedSet = new Set(
      followedDocs.map((doc) => doc.targetId.toString()),
    );

    const result: Record<string, boolean> = {};
    for (const id of targetIds) {
      result[id] = followedSet.has(id);
    }
    return result;
  }

  async getFollowedStories(
    userId: string,
    query: QueryFollowedStoriesDto,
  ): Promise<PaginatedResult<FollowedStoryItem>> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: this.toObjectId(userId),
          targetType: FollowTargetType.STORY,
        },
      },
      {
        $lookup: {
          from: 'stories',
          localField: 'targetId',
          foreignField: '_id',
          as: 'story',
        },
      },
      { $unwind: '$story' },
      {
        $match: {
          'story.status': StoryStatus.PUBLISHED,
          'story.visibility': StoryVisibility.PUBLIC,
        },
      },
    ];

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [{ 'story.title': regex }, { 'story.slug': regex }],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'story.authorId',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      {
        $lookup: {
          from: 'author_profiles',
          localField: 'story.authorId',
          foreignField: 'userId',
          as: 'authorProfile',
        },
      },
    );

    const sortStage = this.buildStorySortStage(query.sortBy);
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: '$story._id',
              title: '$story.title',
              slug: '$story.slug',
              coverUrl: '$story.coverUrl',
              description: '$story.description',
              author: {
                $cond: {
                  if: { $gt: [{ $size: '$authorUser' }, 0] },
                  then: {
                    _id: { $arrayElemAt: ['$authorUser._id', 0] },
                    username: { $arrayElemAt: ['$authorUser.username', 0] },
                    displayName: {
                      $arrayElemAt: ['$authorUser.displayName', 0],
                    },
                    penName: {
                      $ifNull: [
                        { $arrayElemAt: ['$authorProfile.penName', 0] },
                        { $arrayElemAt: ['$authorUser.displayName', 0] },
                      ],
                    },
                    avatarUrl: {
                      $arrayElemAt: ['$authorUser.avatarUrl', 0],
                    },
                  },
                  else: null,
                },
              },
              stats: {
                viewCount: { $ifNull: ['$story.stats.viewCount', 0] },
                followCount: { $ifNull: ['$story.stats.followCount', 0] },
                chapterCount: { $ifNull: ['$story.stats.chapterCount', 0] },
                ratingAverage: {
                  $ifNull: ['$story.stats.ratingAverage', 0],
                },
              },
              progressState: '$story.progressState',
              updatedAt: '$story.updatedAt',
              followedAt: '$createdAt',
            },
          },
        ],
        totalItems: [{ $count: 'count' }],
      },
    });

    const aggregate = this.followModel.aggregate(pipeline);

    if (query.sortBy === FollowStorySortOption.TITLE) {
      aggregate.collation({ locale: 'vi' });
    }

    const [result] = await aggregate.exec();
    const items = (result?.items ?? []) as FollowedStoryItem[];
    const totalItems = result?.totalItems?.[0]?.count ?? 0;

    return { items, pagination: buildPaginationMeta(totalItems, page, limit) };
  }

  async getFollowedAuthors(
    userId: string,
    query: QueryFollowedAuthorsDto,
  ): Promise<PaginatedResult<FollowedAuthorItem>> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: this.toObjectId(userId),
          targetType: FollowTargetType.AUTHOR,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'targetId',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      { $unwind: '$authorUser' },
      {
        $match: {
          'authorUser.status': { $ne: UserStatus.BANNED },
        },
      },
      {
        $lookup: {
          from: 'author_profiles',
          localField: 'targetId',
          foreignField: 'userId',
          as: 'profile',
        },
      },
    ];

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'authorUser.displayName': regex },
            { 'authorUser.username': regex },
            { 'profile.penName': regex },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: '$authorUser._id',
              username: '$authorUser.username',
              displayName: '$authorUser.displayName',
              penName: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.penName', 0] },
                  '$authorUser.displayName',
                ],
              },
              avatarUrl: '$authorUser.avatarUrl',
              biography: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.biography', 0] },
                  '',
                ],
              },
              followerCount: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.followerCount', 0] },
                  0,
                ],
              },
              storyCount: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.storyCount', 0] },
                  0,
                ],
              },
              totalViews: {
                $ifNull: [
                  { $arrayElemAt: ['$profile.totalViews', 0] },
                  0,
                ],
              },
              followedAt: '$createdAt',
            },
          },
        ],
        totalItems: [{ $count: 'count' }],
      },
    });

    const [result] = await this.followModel.aggregate(pipeline).exec();
    const items = (result?.items ?? []) as FollowedAuthorItem[];
    const totalItems = result?.totalItems?.[0]?.count ?? 0;

    return { items, pagination: buildPaginationMeta(totalItems, page, limit) };
  }

  private async validateTarget(
    currentUserId: string,
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    if (targetType === FollowTargetType.STORY) {
      const story = await this.storyModel
        .findById(targetId)
        .select('_id status visibility')
        .lean()
        .exec();

      if (!story) {
        throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
      }
    } else if (targetType === FollowTargetType.AUTHOR) {
      if (targetId.toString() === currentUserId) {
        throw new BadRequestException(ErrorCode.CANNOT_FOLLOW_SELF);
      }

      const user = await this.userModel
        .findOne({
          _id: targetId,
          status: { $ne: UserStatus.BANNED },
        })
        .select('_id')
        .lean()
        .exec();

      if (!user) {
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      }
    }
  }

  private async incrementCounter(
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    try {
      if (targetType === FollowTargetType.STORY) {
        await this.storyModel
          .updateOne({ _id: targetId }, { $inc: { 'stats.followCount': 1 } })
          .exec();
      } else if (targetType === FollowTargetType.AUTHOR) {
        await this.authorProfileModel
          .updateOne({ userId: targetId }, { $inc: { followerCount: 1 } })
          .exec();
      }
    } catch (err) {
      this.logger.warn(
        `Không thể tăng counter cho ${targetType}:${targetId}: ${err}`,
      );
    }
  }

  private async decrementCounter(
    targetType: FollowTargetType,
    targetId: Types.ObjectId,
  ): Promise<void> {
    try {
      if (targetType === FollowTargetType.STORY) {
        await this.storyModel
          .updateOne(
            { _id: targetId, 'stats.followCount': { $gt: 0 } },
            { $inc: { 'stats.followCount': -1 } },
          )
          .exec();
      } else if (targetType === FollowTargetType.AUTHOR) {
        await this.authorProfileModel
          .updateOne(
            { userId: targetId, followerCount: { $gt: 0 } },
            { $inc: { followerCount: -1 } },
          )
          .exec();
      }
    } catch (err) {
      this.logger.warn(
        `Không thể giảm counter cho ${targetType}:${targetId}: ${err}`,
      );
    }
  }

  private buildStorySortStage(
    sortBy?: FollowStorySortOption,
  ): Record<string, 1 | -1> {
    switch (sortBy) {
      case FollowStorySortOption.TITLE:
        return { 'story.title': 1 };
      case FollowStorySortOption.UPDATED:
        return { 'story.updatedAt': -1 };
      case FollowStorySortOption.FOLLOWED_AT:
      default:
        return { createdAt: -1 };
    }
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }
    return new Types.ObjectId(value);
  }
}
