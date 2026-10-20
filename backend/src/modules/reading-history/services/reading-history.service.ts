import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { Chapter, ChapterDocument } from '../../chapters/schemas/chapter.schema.js';
import { Genre, GenreDocument } from '../../genres/schemas/genre.schema.js';
import { Story, StoryDocument } from '../../stories/schemas/story.schema.js';
import {
  QueryReadingHistoryDto,
  ReadingHistorySortOption,
  ReadingStatusFilter,
} from '../dto/query-reading-history.dto.js';
import {
  ReadingHistory,
  ReadingHistoryDocument,
} from '../schemas/reading-history.schema.js';

export interface ChapterInfo {
  _id: Types.ObjectId;
  chapterNumber: number;
  title: string;
}

export interface StoryInfo {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  coverUrl?: string | null;
}

export interface ChapterReadDetail {
  chapter: ChapterInfo | null;
  firstReadAt: Date;
  lastReadAt: Date;
  readCount: number;
}

export interface ReadingHistoryStoryItem {
  story: StoryInfo;
  firstReadAt: Date;
  lastReadAt: Date;
  highestChapterNumber: number;
  chaptersReadCount: number;
  /** Tổng số chương đã phát hành của truyện, dùng để tính % tiến độ ở frontend */
  totalChapters: number;
  readCount: number;
  progressPercent: number;
  currentChapter: ChapterInfo | null;
  recentChapters: ChapterReadDetail[];
}

export interface ReadingHistoryStoryDetail {
  story: StoryInfo;
  firstReadAt: Date;
  lastReadAt: Date;
  highestChapterNumber: number;
  chaptersReadCount: number;
  totalChapters: number;
  readCount: number;
  progressPercent: number;
  currentChapter: ChapterInfo | null;
  chapters: ChapterReadDetail[];
}

export interface RecordChapterResult {
  recorded: boolean;
  log: {
    _id: Types.ObjectId;
    storyId: Types.ObjectId;
    chapterId: Types.ObjectId;
    readAt: Date;
  };
}

interface ChapterStat {
  chapterId: Types.ObjectId;
  firstReadAt: Date;
  lastReadAt: Date;
  readCount: number;
}

interface StoryHistoryRow {
  story: StoryInfo;
  firstReadAt: Date;
  lastReadAt: Date;
  highestChapterNumber: number;
  chaptersReadCount: number;
  totalChapters: number;
  readCount: number;
  progressPercent: number;
  currentChapterId: Types.ObjectId;
  recentChapterEntries: ChapterStat[];
}

/** Thời gian chống trùng: mở lại cùng chương trong khoảng này thì không tạo log mới. */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

/** Số chương gần đây gắn kèm mỗi truyện trong danh sách (chỉ giới hạn khi hiển thị). */
const RECENT_CHAPTERS_LIMIT = 3;

@Injectable()
export class ReadingHistoryService {
  constructor(
    @InjectModel(ReadingHistory.name)
    private readonly readingHistoryModel: Model<ReadingHistoryDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<GenreDocument>,
  ) {}

  /**
   * Ghi nhận một lần đọc chương.
   *
   * Bảng reading_history là event log: mỗi lần đọc là 1 document,
   * đọc lại cùng chương vẫn tạo document mới (không có unique index).
   * Riêng trường hợp F5 / mở lại liên tục thì chặn bằng khoảng DEDUPE_WINDOW_MS
   * để 1 lần đọc không bị nhân thành nhiều document rác.
   */
  async recordChapter(
    userId: string,
    chapterId: string,
  ): Promise<RecordChapterResult> {
    const userObjectId = this.toObjectId(userId);
    const chapterObjectId = this.toObjectId(chapterId);

    // Cần storyId để sau này gom log theo truyện
    const chapter = await this.chapterModel
      .findById(chapterObjectId)
      .select('_id storyId')
      .lean();

    if (!chapter) {
      throw new NotFoundException(ErrorCode.CHAPTER_NOT_FOUND);
    }

    const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const recentLog = await this.readingHistoryModel
      .findOne({
        userId: userObjectId,
        chapterId: chapterObjectId,
        createdAt: { $gte: dedupeSince },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (recentLog) {
      return { recorded: false, log: this.toLogResult(recentLog) };
    }

    const created = await this.readingHistoryModel.create({
      userId: userObjectId,
      storyId: chapter.storyId,
      chapterId: chapterObjectId,
    });

    return { recorded: true, log: this.toLogResult(created) };
  }

  /**
   * Danh sách lịch sử đọc gom theo truyện, dùng cho trang "Lịch sử đọc".
   * Phần gom nhóm + lọc nặng nằm trong buildStoryHistoryPipeline; ở đây chỉ chuẩn bị
   * điều kiện lọc ban đầu và gắn thông tin chương cho đúng trang hiện tại.
   */
  async findAllForUser(
    userId: string,
    query: QueryReadingHistoryDto,
  ): Promise<PaginatedResult<ReadingHistoryStoryItem>> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const initialMatch: Record<string, any> = { userId: this.toObjectId(userId) };
    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) {
        createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        createdAt.$lte = new Date(query.to);
      }
      initialMatch.createdAt = createdAt;
    }

    const { found, genreId } = await this.resolveGenreId(query.genre);
    if (!found) {
      return { items: [], pagination: buildPaginationMeta(0, page, limit) };
    }

    const aggregate = this.readingHistoryModel.aggregate(
      this.buildStoryHistoryPipeline(initialMatch, genreId, query, page, limit),
    );

    // Sắp theo tên truyện thì dùng collation tiếng Việt để "Á" không bị xếp sau "Z"
    if (query.sortBy === ReadingHistorySortOption.TITLE) {
      aggregate.collation({ locale: 'vi' });
    }

    const [result] = await aggregate.exec();
    const rows = (result?.items ?? []) as StoryHistoryRow[];
    const totalItems = result?.totalItems?.[0]?.count ?? 0;

    // Chỉ lấy thông tin chương cho những gì trang này thực sự hiển thị
    const neededChapterIds = new Set<string>();
    for (const row of rows) {
      if (row.currentChapterId) {
        neededChapterIds.add(String(row.currentChapterId));
      }
      for (const entry of row.recentChapterEntries ?? []) {
        neededChapterIds.add(String(entry.chapterId));
      }
    }

    const chapterDocs = neededChapterIds.size
      ? await this.chapterModel
          .find({ _id: { $in: [...neededChapterIds] } })
          .select('chapterNumber title')
          .lean()
          .exec()
      : [];
    const chapterMap = new Map(
      chapterDocs.map((chapter) => [String(chapter._id), chapter]),
    );

    const toChapterInfo = (chapterId: unknown): ChapterInfo | null => {
      const chapter = chapterMap.get(String(chapterId));
      if (!chapter) {
        return null;
      }
      return {
        _id: chapter._id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
      };
    };

    const items: ReadingHistoryStoryItem[] = rows.map((row) => ({
      story: row.story,
      firstReadAt: row.firstReadAt,
      lastReadAt: row.lastReadAt,
      highestChapterNumber: row.highestChapterNumber,
      chaptersReadCount: row.chaptersReadCount,
      totalChapters: row.totalChapters,
      readCount: row.readCount,
      progressPercent: row.progressPercent,
      currentChapter: toChapterInfo(row.currentChapterId),
      recentChapters: (row.recentChapterEntries ?? []).map((entry) => ({
        chapter: toChapterInfo(entry.chapterId),
        firstReadAt: entry.firstReadAt,
        lastReadAt: entry.lastReadAt,
        readCount: entry.readCount,
      })),
    }));

    return { items, pagination: buildPaginationMeta(totalItems, page, limit) };
  }

  /**
   * Chi tiết lịch sử đọc của 1 truyện: tiến độ + toàn bộ chương đã đọc (mỗi chương 1 dòng).
   * Số log của 1 người với 1 truyện là nhỏ nên gộp ở JS cho dễ đọc thay vì aggregation.
   * Trả về null nếu người dùng chưa từng đọc truyện này.
   */
  async findOneForStory(
    userId: string,
    storyId: string,
  ): Promise<ReadingHistoryStoryDetail | null> {
    const userObjectId = this.toObjectId(userId);
    const storyObjectId = this.toObjectId(storyId);

    const logs = await this.readingHistoryModel
      .find({ userId: userObjectId, storyId: storyObjectId })
      .select('chapterId createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!logs.length) {
      return null;
    }

    // Schema khai báo createdAt là optional nên phải tự bù mốc thời gian;
    // ObjectId có sẵn thời điểm tạo nên dùng nó làm giá trị dự phòng
    const chapterStats = this.groupLogsByChapter(
      logs.map((log) => ({
        chapterId: log.chapterId,
        createdAt: log.createdAt ?? log._id.getTimestamp(),
      })),
    );

    const [story, chapterDocs] = await Promise.all([
      this.storyModel
        .findById(storyObjectId)
        .select('title slug coverUrl stats.chapterCount')
        .lean()
        .exec(),
      this.chapterModel
        .find({ _id: { $in: chapterStats.map((item) => item.chapterId) } })
        .select('chapterNumber title')
        .lean()
        .exec(),
    ]);

    const chapterMap = new Map(
      chapterDocs.map((chapter) => [String(chapter._id), chapter]),
    );

    const chapters = chapterStats
      .map((stat) => {
        const chapter = chapterMap.get(String(stat.chapterId));
        return {
          chapter: chapter
            ? {
                _id: chapter._id,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
              }
            : null,
          firstReadAt: stat.firstReadAt,
          lastReadAt: stat.lastReadAt,
          readCount: stat.readCount,
        };
      })
      .sort(
        (a, b) =>
          (a.chapter?.chapterNumber ?? 0) - (b.chapter?.chapterNumber ?? 0),
      );

    const highestChapterNumber = chapters.reduce(
      (max, item) => Math.max(max, item.chapter?.chapterNumber ?? 0),
      0,
    );
    const readCount = chapters.reduce((sum, item) => sum + item.readCount, 0);

    // chapterStats chưa sắp thứ tự nên phải quét để suy ra mốc đầu/cuối
    // và chương đang đọc (lần đọc gần nhất lớn nhất)
    const firstReadAt = chapterStats.reduce(
      (earliest, item) =>
        item.firstReadAt < earliest ? item.firstReadAt : earliest,
      chapterStats[0].firstReadAt,
    );
    const lastReadAt = chapterStats.reduce(
      (latest, item) => (item.lastReadAt > latest ? item.lastReadAt : latest),
      chapterStats[0].lastReadAt,
    );
    const currentStat = chapterStats.reduce(
      (latest, item) => (item.lastReadAt > latest.lastReadAt ? item : latest),
      chapterStats[0],
    );
    const currentChapterDoc = chapterMap.get(String(currentStat.chapterId));

    return {
      story: {
        _id: story?._id as Types.ObjectId,
        title: story?.title as string,
        slug: story?.slug as string,
        coverUrl: story?.coverUrl,
      },
      firstReadAt,
      lastReadAt,
      highestChapterNumber,
      chaptersReadCount: chapters.length,
      totalChapters: story?.stats?.chapterCount ?? 0,
      readCount,
      progressPercent: this.calcProgressPercent(
        chapters.length,
        story?.stats?.chapterCount ?? 0,
      ),
      currentChapter: currentChapterDoc
        ? {
            _id: currentChapterDoc._id,
            chapterNumber: currentChapterDoc.chapterNumber,
            title: currentChapterDoc.title,
          }
        : null,
      chapters,
    };
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }
    return new Types.ObjectId(value);
  }

  private toLogResult(record: {
    _id: Types.ObjectId;
    storyId: Types.ObjectId;
    chapterId: Types.ObjectId;
    createdAt?: Date;
  }): RecordChapterResult['log'] {
    return {
      _id: record._id,
      storyId: record.storyId,
      chapterId: record.chapterId,
      readAt: record.createdAt as Date,
    };
  }

  /**
   * Tiến độ % chỉ để hiển thị/filter nên tính bằng công thức, không lưu DB.
   * Số chương đã đọc chia cho tổng số chương đã phát hành của truyện, kẹp trong 0..100.
   * Dùng số chương đã đọc (không phải chương lớn nhất) để đọc nhảy cóc không bị tính là đọc hết.
   * chapterCount = 0 (truyện chưa có chương nào) thì trả 0 để tránh chia cho 0.
   */
  private calcProgressPercent(
    chaptersReadCount: number,
    totalChapters: number,
  ): number {
    if (!totalChapters || totalChapters <= 0) {
      return 0;
    }
    const percent = Math.round((chaptersReadCount / totalChapters) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  /**
   * Gộp danh sách log thô thành thống kê theo từng chương:
   * 1 chương 1 dòng, kèm lần đọc đầu / lần đọc gần nhất / số lần đọc.
   * Dùng cho endpoint chi tiết vì dữ liệu của 1 truyện là nhỏ, xử lý ở JS cho dễ đọc.
   */
  private groupLogsByChapter(
    logs: { chapterId: Types.ObjectId; createdAt: Date }[],
  ): ChapterStat[] {
    const map = new Map<string, ChapterStat>();

    for (const log of logs) {
      const key = String(log.chapterId);
      const existed = map.get(key);

      if (!existed) {
        // logs đã sắp mới nhất trước nên phần tử gặp đầu tiên là lần đọc gần nhất
        map.set(key, {
          chapterId: log.chapterId,
          firstReadAt: log.createdAt,
          lastReadAt: log.createdAt,
          readCount: 1,
        });
        continue;
      }

      existed.readCount += 1;
      if (log.createdAt < existed.firstReadAt) {
        existed.firstReadAt = log.createdAt;
      }
      if (log.createdAt > existed.lastReadAt) {
        existed.lastReadAt = log.createdAt;
      }
    }

    return [...map.values()];
  }

  /**
   * Thể loại trong lịch sử hỗ trợ truyền slug (vd: "do-thi") hoặc ObjectId,
   * giống cách StoriesService xử lý. Thể loại không tồn tại thì trả về found = false
   * để bên ngoài chủ động trả danh sách rỗng, tránh việc "bỏ qua filter" gây sai kết quả.
   */
  private async resolveGenreId(
    genre?: string,
  ): Promise<{ found: boolean; genreId: Types.ObjectId | null }> {
    if (!genre?.trim()) {
      return { found: true, genreId: null };
    }

    const genreValue = genre.trim();
    if (Types.ObjectId.isValid(genreValue)) {
      return { found: true, genreId: new Types.ObjectId(genreValue) };
    }

    const matchedGenre = await this.genreModel
      .findOne({ slug: genreValue })
      .select('_id')
      .lean()
      .exec();

    if (!matchedGenre) {
      return { found: false, genreId: null };
    }
    return { found: true, genreId: matchedGenre._id };
  }

  private buildSortStage(
    sortBy?: ReadingHistorySortOption,
  ): Record<string, 1 | -1> {
    switch (sortBy) {
      case ReadingHistorySortOption.PROGRESS:
        return { progressPercent: -1, lastReadAt: -1 };
      case ReadingHistorySortOption.TITLE:
        return { 'storyDocs.title': 1 };
      case ReadingHistorySortOption.LAST_READ:
      default:
        return { lastReadAt: -1 };
    }
  }

  /**
   * Dựng pipeline gom lịch sử đọc theo TRUYỆN (1 dòng / truyện, mới đọc nhất trước)
   * kèm filter: tìm theo tên truyện, thể loại, trạng thái đọc,
   * "đã đọc >= X chương", khoảng thời gian đọc.
   *
   * Cách làm và lý do:
   * - Lọc theo userId + khoảng thời gian trước (có index) => tập log rất nhỏ.
   * - "$sort createdAt -1" rồi "$group" theo chương, sau đó "$sort lastReadAt -1" rồi "$group"
   *   theo truyện: nhờ thứ tự sort trước mỗi group nên $first luôn là phần tử mới nhất
   *   => lấy được "chương đang đọc" và thứ tự 3 chương gần đây mà không cần join thêm.
   * - Không lưu chapterNumber trong log nên phải lookup sang chapters để biết chương lớn nhất.
   *   Chỗ này lookup bằng pipeline có $sort + $limit 1 để mỗi truyện chỉ kéo về 1 document
   *   (nếu lookup cả danh sách chương của mọi truyện thì sẽ rất nặng trước khi phân trang).
   * - progressPercent/totalChapters được tính trong pipeline vì filter theo trạng thái
   *   và sắp theo % tiến độ phải chạy TRƯỚC khi phân trang.
   * - Tên chương của "chương đang đọc" + 3 chương gần đây KHÔNG lookup ở đây mà lấy sau khi
   *   phân trang bằng 1 query $in (mỗi trang tối đa 10 truyện => tối đa 40 chapterId).
   */
  private buildStoryHistoryPipeline(
    initialMatch: Record<string, any>,
    genreId: Types.ObjectId | null,
    query: QueryReadingHistoryDto,
    page: number,
    limit: number,
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [
      { $match: initialMatch },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { storyId: '$storyId', chapterId: '$chapterId' },
          firstReadAt: { $min: '$createdAt' },
          lastReadAt: { $max: '$createdAt' },
          readCount: { $sum: 1 },
        },
      },
      { $sort: { lastReadAt: -1 } },
      {
        $group: {
          _id: '$_id.storyId',
          storyId: { $first: '$_id.storyId' },
          firstReadAt: { $min: '$firstReadAt' },
          lastReadAt: { $max: '$lastReadAt' },
          readCount: { $sum: '$readCount' },
          chaptersReadCount: { $sum: 1 },
          currentChapterId: { $first: '$_id.chapterId' },
          chapterIds: { $push: '$_id.chapterId' },
          chapterEntries: {
            $push: {
              chapterId: '$_id.chapterId',
              firstReadAt: '$firstReadAt',
              lastReadAt: '$lastReadAt',
              readCount: '$readCount',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'chapters',
          let: { ids: '$chapterIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
            { $sort: { chapterNumber: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, chapterNumber: 1 } },
          ],
          as: 'topChapter',
        },
      },
      {
        $lookup: {
          from: 'stories',
          localField: 'storyId',
          foreignField: '_id',
          as: 'storyDocs',
        },
      },
      { $unwind: '$storyDocs' },
      {
        $addFields: {
          highestChapterNumber: {
            $ifNull: [{ $first: '$topChapter.chapterNumber' }, 0],
          },
          totalChapters: { $ifNull: ['$storyDocs.stats.chapterCount', 0] },
        },
      },
      {
        $addFields: {
          progressPercent: {
            $cond: [
              { $gt: ['$totalChapters', 0] },
              {
                $min: [
                  100,
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              '$chaptersReadCount',
                              '$totalChapters',
                            ],
                          },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [{ 'storyDocs.title': regex }, { 'storyDocs.slug': regex }],
        },
      });
    }

    if (genreId) {
      pipeline.push({ $match: { 'storyDocs.genreIds': genreId } });
    }

    if (query.status === ReadingStatusFilter.COMPLETED) {
      pipeline.push({ $match: { progressPercent: { $gte: 100 } } });
    } else if (query.status === ReadingStatusFilter.READING) {
      pipeline.push({ $match: { progressPercent: { $lt: 100 } } });
    }

    if (query.minChapterNumber) {
      pipeline.push({
        $match: { chaptersReadCount: { $gte: query.minChapterNumber } },
      });
    }

    pipeline.push({ $sort: this.buildSortStage(query.sortBy) });

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              story: {
                _id: '$storyDocs._id',
                title: '$storyDocs.title',
                slug: '$storyDocs.slug',
                coverUrl: '$storyDocs.coverUrl',
              },
              firstReadAt: 1,
              lastReadAt: 1,
              highestChapterNumber: 1,
              chaptersReadCount: 1,
              totalChapters: 1,
              readCount: 1,
              progressPercent: 1,
              currentChapterId: 1,
              recentChapterEntries: {
                $slice: ['$chapterEntries', RECENT_CHAPTERS_LIMIT],
              },
            },
          },
        ],
        totalItems: [{ $count: 'count' }],
      },
    });

    return pipeline;
  }
}
