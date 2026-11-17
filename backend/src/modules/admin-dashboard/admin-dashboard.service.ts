import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema.js';
import { TransactionStatus } from '../payments/enums/transaction-status.enum.js';
import { User, UserDocument, UserRole, UserStatus } from '../users/schemas/user.schema.js';
import { AuthorRequest, AuthorRequestDocument, AuthorRequestStatus } from '../users/schemas/author-request.schema.js';
import { Story, StoryDocument, StoryStatus } from '../stories/schemas/story.schema.js';
import { StoryDailyView, StoryDailyViewDocument } from '../stories/schemas/story-daily-view.schema.js';
import { Chapter, ChapterDocument, ChapterStatus } from '../chapters/schemas/chapter.schema.js';
import { Comment, CommentDocument, CommentStatus } from '../comments/schemas/comment.schema.js';
import { StoryRating, StoryRatingDocument, StoryRatingStatus } from '../story-ratings/schemas/story-rating.schema.js';
import { Genre, GenreDocument } from '../genres/schemas/genre.schema.js';
import { DateRangeQueryDto } from '../../common/dto/date-range.dto.js';
import { calculateGrowthPercent, dateRangeKeys, dateRangeMatch, previousDateRange, resolveDateRange } from '../../common/utils/date-range.util.js';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthorRequest.name)
    private readonly authorRequestModel: Model<AuthorRequestDocument>,
    @InjectModel(Story.name)
    private readonly storyModel: Model<StoryDocument>,
    @InjectModel(StoryDailyView.name)
    private readonly storyDailyViewModel: Model<StoryDailyViewDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(StoryRating.name)
    private readonly ratingModel: Model<StoryRatingDocument>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<GenreDocument>,
  ) {}

  /**
   * Tổng quan thống kê toàn diện cho Admin Dashboard
   * Omitted dates return all time; explicit dates/days select a bounded period.
   */
  async getOverview(query?: DateRangeQueryDto | number) {
    const rangeQuery = typeof query === 'number' ? { days: query } : query;
    const allTime = rangeQuery?.days === undefined && rangeQuery?.startDate === undefined && rangeQuery?.endDate === undefined;
    // Keep a finite comparison window for today/yesterday fields while all-time
    // cohorts and totals deliberately omit date predicates.
    const range = resolveDateRange(allTime ? { days: 1 } : rangeQuery);
    const startOfToday = range.start;
    
    // Đầu tháng này và đầu tháng trước để tính tăng trưởng
    const startOfThisMonth = range.start;
    const previousRange = previousDateRange(range);
    const startOfLastMonth = previousRange.start;
    const withinRange = (field: string) => allTime ? {} : dateRangeMatch(field, range);

    // 1. DOANH THU & GIAO DỊCH
    const [
      totalRevenueResult,
      revenueTodayResult,
      revenueThisMonthResult,
      revenueLastMonthResult,
      txStatusCounts,
      coinStatsResult,
    ] = await Promise.all([
      // Tổng doanh thu giao dịch thành công
      this.transactionModel.aggregate([
        { $match: { status: TransactionStatus.SUCCESS, ...withinRange('createdAt') } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalCoins: { $sum: '$totalCoin' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Doanh thu hôm nay
      this.transactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.SUCCESS, ...withinRange('createdAt'),
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$amount' },
            todayCoins: { $sum: '$totalCoin' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Doanh thu tháng này
      this.transactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.SUCCESS, ...withinRange('createdAt'),
          },
        },
        {
          $group: {
            _id: null,
            monthRevenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Doanh thu tháng trước
      allTime ? Promise.resolve([]) : this.transactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.SUCCESS,
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        {
          $group: {
            _id: null,
            monthRevenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Đếm số lượng theo từng trạng thái giao dịch
      this.transactionModel.aggregate([
        { $match: withinRange('createdAt') },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      // Thống kê coin nạp
      this.transactionModel.aggregate([
        { $match: { status: TransactionStatus.SUCCESS, ...withinRange('createdAt') } },
        {
          $group: {
            _id: null,
            baseCoin: { $sum: '$coinAmount' },
            bonusCoin: { $sum: '$bonusCoin' },
            totalCoin: { $sum: '$totalCoin' },
          },
        },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const totalTransactions = totalRevenueResult[0]?.count || 0;
    const todayRevenue = revenueTodayResult[0]?.todayRevenue || 0;
    const todayTransactions = revenueTodayResult[0]?.count || 0;
    const thisMonthRevenue = revenueThisMonthResult[0]?.monthRevenue || 0;
    const lastMonthRevenue = revenueLastMonthResult[0]?.monthRevenue || 0;

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    } else if (thisMonthRevenue > 0) {
      revenueGrowth = 100;
    }

    const txStatusMap: Record<string, number> = {
      SUCCESS: 0,
      PENDING: 0,
      FAILED: 0,
    };
    for (const item of txStatusCounts) {
      if (item._id && txStatusMap.hasOwnProperty(item._id)) {
        txStatusMap[item._id] = item.count;
      }
    }

    // 2. NGƯỜI DÙNG & TÁC GIẢ
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      usersCount,
      authorsCount,
      managersCount,
      adminsCount,
      newUsersToday,
      newUsersYesterday,
      newUsers7Days,
      pendingAuthorRequests,
    ] = await Promise.all([
      this.userModel.countDocuments(withinRange('createdAt')),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE, ...withinRange('createdAt') }),
      this.userModel.countDocuments({ status: UserStatus.BANNED, ...withinRange('createdAt') }),
      this.userModel.countDocuments({ role: UserRole.USER, ...withinRange('createdAt') }),
      this.userModel.countDocuments({ role: UserRole.AUTHOR, ...withinRange('createdAt') }),
      this.userModel.countDocuments({ role: UserRole.MANAGER, ...withinRange('createdAt') }),
      this.userModel.countDocuments({ role: UserRole.ADMIN, ...withinRange('createdAt') }),
      this.userModel.countDocuments(withinRange('createdAt')),
      allTime ? Promise.resolve(0) : this.userModel.countDocuments({ createdAt: { $gte: previousRange.start, $lt: previousRange.endExclusive } }),
      this.userModel.countDocuments(withinRange('createdAt')),
      this.authorRequestModel.countDocuments({ status: AuthorRequestStatus.PENDING, ...withinRange('createdAt') }),
    ]);

    let userGrowthToday = 0;
    if (newUsersYesterday > 0) {
      userGrowthToday = calculateGrowthPercent(newUsersToday, newUsersYesterday);
    } else if (newUsersToday > 0) {
      userGrowthToday = 100;
    }

    // 3. TRUYỆN & CHƯƠNG & KIỂM DUYỆT
    const [
      totalStories,
      publishedStories,
      pendingStories,
      rejectedStories,
      draftStories,
      storyStatsAgg,
      totalChapters,
      publishedChapters,
      pendingChapters,
      rejectedChapters,
      draftChapters,
    ] = await Promise.all([
      this.storyModel.countDocuments(withinRange('createdAt')),
      this.storyModel.countDocuments({ status: StoryStatus.PUBLISHED, ...withinRange('createdAt') }),
      this.storyModel.countDocuments({ status: StoryStatus.PENDING_REVIEW, ...withinRange('createdAt') }),
      this.storyModel.countDocuments({ status: StoryStatus.REJECTED, ...withinRange('createdAt') }),
      this.storyModel.countDocuments({ status: StoryStatus.DRAFT, ...withinRange('createdAt') }),
      this.storyModel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$stats.viewCount' },
            totalFollows: { $sum: '$stats.followCount' },
            totalRatingCount: { $sum: '$stats.ratingCount' },
            totalWordCount: { $sum: '$stats.wordCount' },
          },
        },
      ]),
      this.chapterModel.countDocuments(withinRange('createdAt')),
      this.chapterModel.countDocuments({ status: ChapterStatus.PUBLISHED, ...withinRange('createdAt') }),
      this.chapterModel.countDocuments({ status: ChapterStatus.PENDING_REVIEW, ...withinRange('createdAt') }),
      this.chapterModel.countDocuments({ status: ChapterStatus.REJECTED, ...withinRange('createdAt') }),
      this.chapterModel.countDocuments({ status: ChapterStatus.DRAFT, ...withinRange('createdAt') }),
    ]);

    const totalFollows = storyStatsAgg[0]?.totalFollows || 0;

    // 4. BÌNH LUẬN & ĐÁNH GIÁ
    const [
      totalComments,
      visibleComments,
      hiddenComments,
      deletedComments,
      totalRatings,
      ratingStarsAgg,
    ] = await Promise.all([
      this.commentModel.countDocuments(withinRange('createdAt')),
      this.commentModel.countDocuments({ status: CommentStatus.VISIBLE, ...withinRange('createdAt') }),
      this.commentModel.countDocuments({ status: CommentStatus.HIDDEN, ...withinRange('createdAt') }),
      this.commentModel.countDocuments({ status: CommentStatus.DELETED, ...withinRange('createdAt') }),
      this.ratingModel.countDocuments(withinRange('createdAt')),
      this.ratingModel.aggregate([
        {
          $match: { ...withinRange('createdAt') },
        },
        { $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumScore = 0;
    let validRatingsCount = 0;
    for (const item of ratingStarsAgg) {
      if (item._id >= 1 && item._id <= 5) {
        ratingDistribution[item._id] = item.count;
        sumScore += item._id * item.count;
        validRatingsCount += item.count;
      }
    }
    const averageRatingScore = validRatingsCount > 0 ? Number((sumScore / validRatingsCount).toFixed(1)) : 5.0;

    // 5. TIME-SERIES CHARTS (Theo từng ngày trong N ngày gần nhất)
    // Lấy doanh thu theo ngày
    const revenueByDayAgg = await this.transactionModel.aggregate([
      {
        $match: {
          status: TransactionStatus.SUCCESS,
            ...withinRange('createdAt'),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' },
          },
          revenue: { $sum: '$amount' },
          coins: { $sum: '$totalCoin' },
          txCount: { $sum: 1 },
        },
      },
    ]);

    // Lấy đăng ký user mới theo ngày
    const userGrowthByDayAgg = await this.userModel.aggregate([
      {
        $match: {
          ...withinRange('createdAt'),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Lấy lượt xem theo ngày từ StoryDailyView
    const viewsByDayAgg = await this.storyDailyViewModel.aggregate([
      {
        $match: {
          ...(allTime ? {} : { date: { $in: dateRangeKeys(range) } }),
        },
      },
      {
        $group: {
          _id: '$date',
          views: { $sum: '$views' },
        },
      },
    ]);

    const revenueByDayMap = new Map<string, { revenue: number; coins: number; txCount: number }>();
    revenueByDayAgg.forEach((r) => {
      revenueByDayMap.set(r._id, { revenue: r.revenue, coins: r.coins, txCount: r.txCount });
    });

    const userByDayMap = new Map<string, number>();
    userGrowthByDayAgg.forEach((u) => {
      userByDayMap.set(u._id, u.count);
    });

    const viewsByDayMap = new Map<string, number>();
    viewsByDayAgg.forEach((v) => {
      viewsByDayMap.set(v._id, v.views);
    });

    if (allTime) { revenueGrowth = 0; userGrowthToday = 0; }
    const todayKey = range.endDate;
    const firstActivity = allTime ? await Promise.all([
      this.storyModel, this.chapterModel, this.commentModel, this.ratingModel, this.authorRequestModel,
    ].map((model) => model.aggregate([
      { $group: { _id: null, first: { $min: '$createdAt' } } },
    ]))) : [];
    const recordedDates = [
      ...firstActivity.flatMap((rows) => rows[0]?.first ? [new Date(new Date(rows[0].first).getTime() + 7 * 3600000).toISOString().slice(0, 10)] : []),
      ...revenueByDayMap.keys(),
      ...userByDayMap.keys(),
      ...viewsByDayMap.keys(),
    ].filter((key) => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= todayKey).sort();
    const timelineStart = allTime ? (recordedDates[0] || todayKey) : range.startDate;
    const timelineEnd = allTime ? todayKey : range.endDate;
    const timelineKeys: string[] = [];
    for (let cursor = new Date(`${timelineStart}T00:00:00Z`), end = new Date(`${timelineEnd}T00:00:00Z`); cursor <= end; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
      timelineKeys.push(cursor.toISOString().slice(0, 10));
    }

    // Tạo danh sách liên tục các ngày
    const chartTimeline: Array<{
      date: string;
      label: string;
      revenue: number;
      coins: number;
      transactions: number;
      newUsers: number;
      views: number;
    }> = [];

    for (const dateStr of timelineKeys) {
      const [, mm, dd] = dateStr.split('-');
      const label = allTime ? dateStr : `${dd}/${mm}`;

      const revData = revenueByDayMap.get(dateStr) || { revenue: 0, coins: 0, txCount: 0 };
      const newUsers = userByDayMap.get(dateStr) || 0;
      const views = viewsByDayMap.get(dateStr) || 0;

      chartTimeline.push({
        date: dateStr,
        label,
        revenue: revData.revenue,
        coins: revData.coins,
        transactions: revData.txCount,
        newUsers,
        views,
      });
    }

    // 6. PHÂN BỐ THỂ LOẠI (Category / Genre Distribution)
    const genreDistributionAgg = await this.storyModel.aggregate([
      { $match: withinRange('createdAt') },
      { $unwind: '$genreIds' },
      {
        $group: {
          _id: '$genreIds',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Populate tên thể loại
    const genreIds = genreDistributionAgg.map((g) => g._id);
    const genresList = await this.genreModel.find({ _id: { $in: genreIds } }).lean();
    const genreNameMap = new Map<string, string>();
    genresList.forEach((g) => genreNameMap.set(g._id.toString(), g.name));

    const totalGenreStoriesCount = genreDistributionAgg.reduce((acc, curr) => acc + curr.count, 0) || 1;
    const categoryDistribution = genreDistributionAgg.map((item) => {
      const idStr = item._id.toString();
      const name = genreNameMap.get(idStr) || 'Khác';
      return {
        id: idStr,
        name,
        count: item.count,
        percentage: Math.round((item.count / totalGenreStoriesCount) * 100),
      };
    });

    // 7. TOP TRUYỆN XEM NHIỀU & NỔI BẬT NHẤT
    const topViews = await this.storyDailyViewModel.aggregate([
      { $match: allTime ? {} : { date: { $gte: range.startDate, $lte: range.endDate } } },
      { $group: { _id: '$storyId', views: { $sum: '$views' } } },
      { $sort: { views: -1, _id: 1 } },
    ]);
    const topViewsMap = new Map(topViews.map((v) => [v._id.toString(), v.views]));
    const topStoriesRaw = await this.storyModel
      .find({ status: StoryStatus.PUBLISHED, _id: { $in: topViews.map((v) => v._id) } })
      .populate('authorId', 'displayName username avatarUrl')
      .lean();

    const topStories = topStoriesRaw.sort((a, b) => Number(topViewsMap.get(b._id.toString()) || 0) - Number(topViewsMap.get(a._id.toString()) || 0)).slice(0, 6).map((s: any) => ({
      _id: s._id.toString(),
      title: s.title,
      slug: s.slug,
      coverImage: s.coverImage || null,
      authorName: s.authorId?.displayName || s.authorId?.username || 'Tác giả',
      authorAvatar: s.authorId?.avatarUrl || null,
      views: topViewsMap.get(s._id.toString()) || 0,
      likes: s.stats?.followCount || 0,
      chapterCount: s.stats?.chapterCount || 0,
      ratingAverage: s.stats?.ratingAverage || 5,
      ratingCount: s.stats?.ratingCount || 0,
    }));

    // 8. 6 GIAO DỊCH NẠP GẦN NHẤT
    const recentTransactionsRaw = await this.transactionModel
      .find(withinRange('createdAt'))
      .populate('userId', 'displayName username email avatarUrl')
      .populate('packageId', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const recentTransactions = recentTransactionsRaw.map((tx: any) => ({
      _id: tx._id.toString(),
      orderCode: tx.orderCode,
      amount: tx.amount,
      coinAmount: tx.coinAmount,
      bonusCoin: tx.bonusCoin,
      totalCoin: tx.totalCoin,
      status: tx.status,
      bankCode: tx.bankCode || 'VNPAY',
      cardType: tx.cardType,
      createdAt: tx.createdAt,
      packageName: tx.packageId?.name || `${tx.coinAmount.toLocaleString('vi-VN')} Xu`,
      user: {
        _id: tx.userId?._id?.toString() || '',
        displayName: tx.userId?.displayName || 'Khách',
        username: tx.userId?.username || 'user',
        email: tx.userId?.email || '',
        avatarUrl: tx.userId?.avatarUrl || null,
      },
    }));

    // 9. DANH SÁCH VIỆC CẦN XỬ LÝ GẤP (URGENT PENDING QUEUE)
    const [urgentPendingStories, urgentPendingChapters, urgentAuthorRequests] = await Promise.all([
      this.storyModel
        .find({ status: StoryStatus.PENDING_REVIEW, ...withinRange('createdAt') })
        .populate('authorId', 'displayName username')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
      this.chapterModel
        .find({ status: ChapterStatus.PENDING_REVIEW, ...withinRange('createdAt') })
        .populate('storyId', 'title')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
      this.authorRequestModel
        .find({ status: AuthorRequestStatus.PENDING, ...withinRange('createdAt') })
        .populate('userId', 'displayName username email avatarUrl')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
    ]);

    return {
      range: { mode: allTime ? 'all' : 'range', startDate: allTime ? null : range.startDate, endDate: allTime ? null : range.endDate, dayCount: allTime ? null : range.dayCount, timeZone: 'Asia/Ho_Chi_Minh' },
      metadata: { cohort: 'createdAt', status: 'current', snapshotFields: ['kpi.stories.totalFollows', 'topStories.likes', 'topStories.chapterCount', 'topStories.ratingAverage', 'topStories.ratingCount'], legacyPeriodFields: allTime ? 'allTime; previous period and growth are not applicable (0)' : 'selectedRange; lastMonth and newYesterday compare previous equal-length range' },
      kpi: {
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growthRate: revenueGrowth,
          totalTransactions,
          todayTransactions,
          coins: {
            base: coinStatsResult[0]?.baseCoin || 0,
            bonus: coinStatsResult[0]?.bonusCoin || 0,
            total: coinStatsResult[0]?.totalCoin || 0,
          },
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          roles: {
            user: usersCount,
            author: authorsCount,
            manager: managersCount,
            admin: adminsCount,
          },
          newToday: newUsersToday,
          newYesterday: newUsersYesterday,
          growthToday: userGrowthToday,
          new7Days: newUsers7Days,
        },
        stories: {
          total: totalStories,
          published: publishedStories,
          pending: pendingStories,
          rejected: rejectedStories,
          draft: draftStories,
          totalViews: chartTimeline.reduce((sum, day) => sum + day.views, 0),
          totalFollows,
        },
        chapters: {
          total: totalChapters,
          published: publishedChapters,
          pending: pendingChapters,
          rejected: rejectedChapters,
          draft: draftChapters,
        },
        pendingSummary: {
          stories: pendingStories,
          chapters: pendingChapters,
          authorRequests: pendingAuthorRequests,
          totalPending: pendingStories + pendingChapters + pendingAuthorRequests,
        },
        engagement: {
          totalComments,
          visibleComments,
          hiddenComments,
          deletedComments,
          totalRatings,
          averageRating: averageRatingScore,
          ratingDistribution,
        },
        transactionsBreakdown: txStatusMap,
      },
      charts: {
        timeline: chartTimeline,
        categories: categoryDistribution,
        ratings: ratingDistribution,
      },
      topStories,
      recentTransactions,
      urgentQueue: {
        stories: urgentPendingStories.map((s: any) => ({
          _id: s._id.toString(),
          title: s.title,
          slug: s.slug,
          coverImage: s.coverImage || null,
          authorName: s.authorId?.displayName || s.authorId?.username || 'Tác giả',
          createdAt: s.createdAt,
        })),
        chapters: urgentPendingChapters.map((c: any) => ({
          _id: c._id.toString(),
          title: c.title,
          chapterNumber: c.chapterNumber,
          storyTitle: c.storyId?.title || 'Truyện',
          createdAt: c.createdAt,
        })),
        authorRequests: urgentAuthorRequests.map((r: any) => ({
          _id: r._id.toString(),
          penName: r.penName,
          userName: r.userId?.displayName || r.userId?.username || 'Người dùng',
          userEmail: r.userId?.email || '',
          userAvatar: r.userId?.avatarUrl || null,
          experience: r.experience,
          createdAt: r.createdAt,
        })),
      },
    };
  }
}
