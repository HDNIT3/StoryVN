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
import { Genre, GenreDocument } from '../../genres/schemas/genre.schema.js';
import { CreateStoryDto, StoryAction } from '../dto/create-story.dto.js';
import { FilterStoriesDto, StorySortOption } from '../dto/filter-stories.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
import { QueryRecentStoriesDto } from '../dto/query-recent-stories.dto.js';
import { UpdateStoryDto } from '../dto/update-story.dto.js';
import {
  Story,
  StoryAgeRating,
  StoryDocument,
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
    @InjectModel(Genre.name)
    private readonly genreModel: Model<GenreDocument>,
  ) { }

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

  async getMyCounts(authorId: Types.ObjectId): Promise<{
    all: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
  }> {
    const countsAggregate = await this.storyModel.aggregate([
      {
        $match: {
          authorId: new Types.ObjectId(authorId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      all: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      draft: 0,
    };

    countsAggregate.forEach((item) => {
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
   * Lấy danh sách truyện mới cập nhật (Công khai cho độc giả)
   * Yêu cầu: Thể loại, Tên, Số chương (chưa có chương), Tác giả, Ngày giờ cập nhật
   * Lọc: status = PUBLISHED, visibility = PUBLIC
   * Sắp xếp: updatedAt giảm dần (mới nhất lên đầu)
   */
  async getLatestUpdated(query: QueryRecentStoriesDto): Promise<PaginatedResult<any>> {
    const filter: Record<string, any> = {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
    };

    if (query.genreId && Types.ObjectId.isValid(query.genreId)) {
      filter.genreIds = new Types.ObjectId(query.genreId);
    }

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { slug: regex }];
    }

    const [stories, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .select('title slug genreIds authorId updatedAt')
        .sort({ updatedAt: -1 })
        .skip(query.skip)
        .limit(query.limit)
        .populate('authorId', 'displayName username')
        .populate('genreIds', 'name slug')
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    // Lấy thông tin bút danh (penName) từ author_profiles
    const authorUserIds = Array.from(
      new Set(
        stories
          .map((s) => (s.authorId as any)?._id?.toString() || s.authorId?.toString())
          .filter(Boolean),
      ),
    );

    let profileMap = new Map<string, any>();
    if (authorUserIds.length > 0) {
      const profiles = await this.authorProfileModel
        .find({
          userId: { $in: authorUserIds.map((id) => new Types.ObjectId(id)) },
        })
        .select('userId penName')
        .lean()
        .exec();

      profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    }

    const items = stories.map((story) => {
      const authorUser = story.authorId as any;
      const authorUserIdStr = authorUser?._id?.toString() || authorUser?.toString();
      const authorProfile = authorUserIdStr ? profileMap.get(authorUserIdStr) : null;
      const authorName =
        authorProfile?.penName ||
        authorUser?.displayName ||
        authorUser?.username ||
        'Tác giả ẩn danh';

      const rawGenres = Array.isArray(story.genreIds) ? story.genreIds : [];
      const genres = rawGenres.map((g: any) => ({
        _id: g._id,
        name: g.name,
        slug: g.slug,
      }));
      const genreNames = rawGenres.map((g: any) => g.name || '').filter(Boolean);
      const primaryGenre = genreNames.length > 0 ? genreNames[0] : 'Chưa phân loại';

      return {
        _id: story._id,
        // Tên truyện
        title: story.title,
        slug: story.slug,

        // Thể loại
        genres,
        genre: primaryGenre,

        // Số chương (hiện chưa có chương)
        latestChapter: 'Chưa có chương',

        // Tác giả
        author: authorName,

        // Ngày giờ cập nhật
        updatedAt: story.updatedAt,
      };
    });

    return {
      items,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Lấy danh sách truyện nổi bật theo lượt xem cao nhất (Top views)
   * Yêu cầu: Ảnh bìa, Tên truyện, Tác giả, Lượt xem
   * Lọc: status = PUBLISHED, visibility = PUBLIC
   * Sắp xếp: stats.viewCount giảm dần
   */
  async getTopViews(limit = 10): Promise<any[]> {
    const take = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const stories = await this.storyModel
      .find({
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
      })
      .select('title slug coverUrl stats.viewCount authorId updatedAt')
      .sort({ 'stats.viewCount': -1, updatedAt: -1 })
      .limit(take)
      .populate('authorId', 'displayName username')
      .lean()
      .exec();

    const authorUserIds = Array.from(
      new Set(
        stories
          .map((s) => (s.authorId as any)?._id?.toString() || s.authorId?.toString())
          .filter(Boolean),
      ),
    );

    let profileMap = new Map<string, any>();
    if (authorUserIds.length > 0) {
      const profiles = await this.authorProfileModel
        .find({
          userId: { $in: authorUserIds.map((id) => new Types.ObjectId(id)) },
        })
        .select('userId penName')
        .lean()
        .exec();

      profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    }

    return stories.map((story) => {
      const authorUser = story.authorId as any;
      const authorUserIdStr = authorUser?._id?.toString() || authorUser?.toString();
      const authorProfile = authorUserIdStr ? profileMap.get(authorUserIdStr) : null;
      const authorName =
        authorProfile?.penName ||
        authorUser?.displayName ||
        authorUser?.username ||
        'Tác giả ẩn danh';

      return {
        _id: story._id,
        title: story.title,
        slug: story.slug,
        coverUrl: story.coverUrl || null,
        author: authorName,
        viewCount: story.stats?.viewCount ?? 0,
      };
    });
  }

  /**
   * Lấy danh sách truyện có bộ lọc: thể loại, tiến độ, sắp xếp, tìm kiếm và phân trang
   * Lọc: status = PUBLISHED, visibility = PUBLIC
   */
  async filterStories(query: FilterStoriesDto): Promise<PaginatedResult<any>> {
    const filter: any = {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
    };

    // 1. Lọc theo trạng thái tiến độ sáng tác (ONGOING, COMPLETED, ON_HOLD)
    if (query.progressState) {
      filter.progressState = query.progressState;
    }

    // 2. Lọc theo Thể loại (hỗ trợ cả slug và ObjectId)
    if (query.genre?.trim()) {
      const genreVal = query.genre.trim();
      if (Types.ObjectId.isValid(genreVal)) {
        filter.genreIds = new Types.ObjectId(genreVal);
      } else {
        const matchedGenre = await this.genreModel
          .findOne({ slug: genreVal })
          .select('_id')
          .lean()
          .exec();

        if (matchedGenre) {
          filter.genreIds = matchedGenre._id;
        } else {
          return {
            items: [],
            pagination: buildPaginationMeta(0, query.page, query.limit),
          };
        }
      }
    }

    // 3. Tìm kiếm theo tên truyện hoặc tác giả
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      const regex = new RegExp(keyword, 'i');

      const matchedAuthors = await this.authorProfileModel
        .find({ penName: regex })
        .select('userId')
        .lean()
        .exec();
      const authorUserIds = matchedAuthors.map((a) => a.userId);

      filter.$or = [
        { title: regex },
        { slug: regex },
        ...(authorUserIds.length > 0 ? [{ authorId: { $in: authorUserIds } }] : []),
      ];
    }

    // 4. Sắp xếp kết quả
    const sort: any = {};
    switch (query.sortBy) {
      case StorySortOption.LATEST_UPDATED:
        sort.updatedAt = -1;
        break;
      case StorySortOption.MOST_VIEWED:
        sort['stats.viewCount'] = -1;
        sort.updatedAt = -1;
        break;
      case StorySortOption.CHAPTER_COUNT:
        sort['stats.chapterCount'] = -1;
        sort.updatedAt = -1;
        break;
      case StorySortOption.TOP_RATED:
        sort['stats.ratingAverage'] = -1;
        sort['stats.ratingCount'] = -1;
        break;
      case StorySortOption.NEWEST_PUBLISHED:
      default:
        sort.publishedAt = -1;
        sort.createdAt = -1;
        break;
    }

    // 5. Truy vấn danh sách và đếm tổng số
    const [stories, totalItems] = await Promise.all([
      this.storyModel
        .find(filter)
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .populate('genreIds', 'name slug')
        .populate('authorId', 'displayName username avatar')
        .lean()
        .exec(),
      this.storyModel.countDocuments(filter),
    ]);

    // 6. Lấy profile tác giả (bút danh)
    const authorUserIds = Array.from(
      new Set(
        stories
          .map((s) => (s.authorId as any)?._id?.toString() || s.authorId?.toString())
          .filter(Boolean),
      ),
    );

    let profileMap = new Map<string, any>();
    if (authorUserIds.length > 0) {
      const profiles = await this.authorProfileModel
        .find({
          userId: { $in: authorUserIds.map((id) => new Types.ObjectId(id)) },
        })
        .select('userId penName')
        .lean()
        .exec();

      profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    }

    // 7. Format dữ liệu trả về cho Frontend
    const items = stories.map((story) => {
      const authorUser = story.authorId as any;
      const authorUserIdStr = authorUser?._id?.toString() || authorUser?.toString();
      const authorProfile = authorUserIdStr ? profileMap.get(authorUserIdStr) : null;
      const authorName =
        authorProfile?.penName ||
        authorUser?.displayName ||
        authorUser?.username ||
        'Tác giả ẩn danh';

      const rawGenres = (story.genreIds as any[]) || [];
      const genres = rawGenres.map((g: any) => ({
        _id: g._id,
        name: g.name,
        slug: g.slug,
      }));

      return {
        _id: story._id,
        title: story.title,
        slug: story.slug,
        coverUrl: story.coverUrl || null,
        description: story.description || '',
        progressState: story.progressState,
        stats: {
          chapterCount: story.stats?.chapterCount ?? 0,
          viewCount: story.stats?.viewCount ?? 0,
          ratingAverage: story.stats?.ratingAverage ?? 0,
          ratingCount: story.stats?.ratingCount ?? 0,
        },
        author: {
          _id: authorUser?._id || null,
          name: authorName,
          avatar: authorUser?.avatar || null,
        },
        genres,
        publishedAt: story.publishedAt || story.createdAt,
        updatedAt: story.updatedAt,
      };
    });

    return {
      items,
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  /**
   * Lấy chi tiết truyện theo slug (hoặc ObjectId dự phòng) cho độc giả công khai
   * Kèm thông tin tác giả và danh sách truyện cùng thể loại
   */
  async getStoryBySlug(slug: string): Promise<any> {
    const cleanSlug = slug?.trim();
    if (!cleanSlug) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const isObjectId = Types.ObjectId.isValid(cleanSlug);
    const filter: any = {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
      ...(isObjectId
        ? { $or: [{ slug: cleanSlug }, { _id: new Types.ObjectId(cleanSlug) }] }
        : { slug: cleanSlug }),
    };

    const story = await this.storyModel
      .findOne(filter)
      .populate('genreIds', 'name slug')
      .populate('tagIds', 'name slug')
      .populate('authorId', 'displayName username avatar email')
      .lean()
      .exec();

    if (!story) {
      throw new NotFoundException(ErrorCode.STORY_NOT_FOUND);
    }

    const authorUser = story.authorId as any;
    const authorUserId = authorUser?._id;
    let authorProfile: any = null;
    if (authorUserId) {
      authorProfile = await this.authorProfileModel
        .findOne({ userId: authorUserId })
        .lean()
        .exec();
    }

    const authorName =
      authorProfile?.penName ||
      authorUser?.displayName ||
      authorUser?.username ||
      'Tác giả ẩn danh';

    const rawGenres = (story.genreIds as any[]) || [];
    const genres = rawGenres.map((g: any) => ({
      _id: g._id,
      name: g.name,
      slug: g.slug,
    }));

    const rawTags = (story.tagIds as any[]) || [];
    const tags = rawTags.map((t: any) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
    }));

    // Lấy danh sách truyện có cùng thể loại
    const genreObjectIds = rawGenres.map((g: any) => g._id).filter(Boolean);
    let sameGenreStories: any[] = [];
    if (genreObjectIds.length > 0) {
      const sameGenreList = await this.storyModel
        .find({
          _id: { $ne: story._id },
          status: StoryStatus.PUBLISHED,
          visibility: StoryVisibility.PUBLIC,
          genreIds: { $in: genreObjectIds },
        })
        .select('title slug coverUrl stats authorId genreIds updatedAt progressState')
        .sort({ 'stats.viewCount': -1, updatedAt: -1 })
        .limit(8)
        .populate('genreIds', 'name slug')
        .populate('authorId', 'displayName username')
        .lean()
        .exec();

      const sameGenreAuthorUserIds = Array.from(
        new Set(
          sameGenreList
            .map((s) => (s.authorId as any)?._id?.toString() || s.authorId?.toString())
            .filter(Boolean),
        ),
      );

      let sameGenreProfileMap = new Map<string, any>();
      if (sameGenreAuthorUserIds.length > 0) {
        const sameGenreProfiles = await this.authorProfileModel
          .find({
            userId: { $in: sameGenreAuthorUserIds.map((id) => new Types.ObjectId(id)) },
          })
          .select('userId penName')
          .lean()
          .exec();
        sameGenreProfileMap = new Map(sameGenreProfiles.map((p) => [p.userId.toString(), p]));
      }

      sameGenreStories = sameGenreList.map((item) => {
        const aUser = item.authorId as any;
        const aIdStr = aUser?._id?.toString() || aUser?.toString();
        const aProf = aIdStr ? sameGenreProfileMap.get(aIdStr) : null;
        const itemAuthorName =
          aProf?.penName || aUser?.displayName || aUser?.username || 'Tác giả ẩn danh';

        return {
          _id: item._id,
          title: item.title,
          slug: item.slug,
          coverUrl: item.coverUrl || null,
          author: {
            _id: aUser?._id || null,
            name: itemAuthorName,
            username: aUser?.username || null,
          },
          stats: {
            chapterCount: item.stats?.chapterCount ?? 0,
            viewCount: item.stats?.viewCount ?? 0,
            ratingAverage: item.stats?.ratingAverage ?? 0,
          },
          genres: ((item.genreIds as any[]) || []).map((g: any) => ({
            _id: g._id,
            name: g.name,
            slug: g.slug,
          })),
          progressState: item.progressState,
          updatedAt: item.updatedAt,
        };
      });
    }

    return {
      _id: story._id,
      title: story.title,
      slug: story.slug,
      coverUrl: story.coverUrl || null,
      description: story.description || '',
      authorNote: story.authorNote || '',
      ageRating: story.ageRating,
      progressState: story.progressState,
      status: story.status,
      visibility: story.visibility,
      stats: {
        chapterCount: story.stats?.chapterCount ?? 0,
        viewCount: story.stats?.viewCount ?? 0,
        followCount: story.stats?.followCount ?? 0,
        ratingAverage: story.stats?.ratingAverage ?? 0,
        ratingCount: story.stats?.ratingCount ?? 0,
        wordCount: story.stats?.wordCount ?? 0,
      },
      genres,
      tags,
      author: {
        _id: authorUser?._id || null,
        username: authorUser?.username || '',
        displayName: authorUser?.displayName || '',
        penName: authorProfile?.penName || authorUser?.displayName || authorUser?.username || 'Tác giả',
        name: authorName,
        avatar: authorUser?.avatar || null,
        bio: authorProfile?.bio || '',
        storyCount: authorProfile?.storyCount ?? 0,
      },
      publishedAt: story.publishedAt || story.createdAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      sameGenreStories,
    };
  }

  /**
   * Lấy danh sách truyện cùng thể loại theo slug
   */
  async getSameGenreStories(slug: string, limit = 6): Promise<any[]> {
    const cleanSlug = slug?.trim();
    if (!cleanSlug) return [];

    const isObjectId = Types.ObjectId.isValid(cleanSlug);
    const filter: any = {
      status: StoryStatus.PUBLISHED,
      visibility: StoryVisibility.PUBLIC,
      ...(isObjectId
        ? { $or: [{ slug: cleanSlug }, { _id: new Types.ObjectId(cleanSlug) }] }
        : { slug: cleanSlug }),
    };

    const targetStory = await this.storyModel.findOne(filter).select('_id genreIds').lean().exec();
    if (!targetStory || !targetStory.genreIds?.length) return [];

    const take = Math.min(Math.max(Number(limit) || 6, 1), 20);

    const sameGenreList = await this.storyModel
      .find({
        _id: { $ne: targetStory._id },
        status: StoryStatus.PUBLISHED,
        visibility: StoryVisibility.PUBLIC,
        genreIds: { $in: targetStory.genreIds },
      })
      .select('title slug coverUrl stats authorId genreIds updatedAt progressState')
      .sort({ 'stats.viewCount': -1, updatedAt: -1 })
      .limit(take)
      .populate('genreIds', 'name slug')
      .populate('authorId', 'displayName username')
      .lean()
      .exec();

    const authorUserIds = Array.from(
      new Set(
        sameGenreList
          .map((s) => (s.authorId as any)?._id?.toString() || s.authorId?.toString())
          .filter(Boolean),
      ),
    );

    let profileMap = new Map<string, any>();
    if (authorUserIds.length > 0) {
      const profiles = await this.authorProfileModel
        .find({
          userId: { $in: authorUserIds.map((id) => new Types.ObjectId(id)) },
        })
        .select('userId penName')
        .lean()
        .exec();
      profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    }

    return sameGenreList.map((item) => {
      const aUser = item.authorId as any;
      const aIdStr = aUser?._id?.toString() || aUser?.toString();
      const aProf = aIdStr ? profileMap.get(aIdStr) : null;
      const itemAuthorName =
        aProf?.penName || aUser?.displayName || aUser?.username || 'Tác giả ẩn danh';

      return {
        _id: item._id,
        title: item.title,
        slug: item.slug,
        coverUrl: item.coverUrl || null,
        author: {
          _id: aUser?._id || null,
          name: itemAuthorName,
          username: aUser?.username || null,
        },
        stats: {
          chapterCount: item.stats?.chapterCount ?? 0,
          viewCount: item.stats?.viewCount ?? 0,
          ratingAverage: item.stats?.ratingAverage ?? 0,
        },
        genres: ((item.genreIds as any[]) || []).map((g: any) => ({
          _id: g._id,
          name: g.name,
          slug: g.slug,
        })),
        progressState: item.progressState,
        updatedAt: item.updatedAt,
      };
    });
  }
}


