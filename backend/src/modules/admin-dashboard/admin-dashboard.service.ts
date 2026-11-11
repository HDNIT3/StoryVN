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
   * @param days Số ngày thống kê cho biểu đồ (mặc định 14 ngày, tùy chọn 7 hoặc 30)
   */
  async getOverview(days = 14) {
    const validDays = Math.min(Math.max(Number(days) || 14, 7), 60);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfDaysAgo = new Date(startOfToday.getTime() - (validDays - 1) * 24 * 60 * 60 * 1000);
    
    // Đầu tháng này và đầu tháng trước để tính tăng trưởng
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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
        { $match: { status: TransactionStatus.SUCCESS } },
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
            status: TransactionStatus.SUCCESS,
            createdAt: { $gte: startOfToday },
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
            status: TransactionStatus.SUCCESS,
            createdAt: { $gte: startOfThisMonth },
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
      this.transactionModel.aggregate([
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
        { $match: { status: TransactionStatus.SUCCESS } },
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
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE }),
      this.userModel.countDocuments({ status: UserStatus.BANNED }),
      this.userModel.countDocuments({ role: UserRole.USER }),
      this.userModel.countDocuments({ role: UserRole.AUTHOR }),
      this.userModel.countDocuments({ role: UserRole.MANAGER }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      this.userModel.countDocuments({ createdAt: { $gte: startOf7DaysAgo } }),
      this.authorRequestModel.countDocuments({ status: AuthorRequestStatus.PENDING }),
    ]);

    let userGrowthToday = 0;
    if (newUsersYesterday > 0) {
      userGrowthToday = Math.round(((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100);
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
      this.storyModel.countDocuments(),
      this.storyModel.countDocuments({ status: StoryStatus.PUBLISHED }),
      this.storyModel.countDocuments({ status: StoryStatus.PENDING_REVIEW }),
      this.storyModel.countDocuments({ status: StoryStatus.REJECTED }),
      this.storyModel.countDocuments({ status: StoryStatus.DRAFT }),
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
      this.chapterModel.countDocuments(),
      this.chapterModel.countDocuments({ status: ChapterStatus.PUBLISHED }),
      this.chapterModel.countDocuments({ status: ChapterStatus.PENDING_REVIEW }),
      this.chapterModel.countDocuments({ status: ChapterStatus.REJECTED }),
      this.chapterModel.countDocuments({ status: ChapterStatus.DRAFT }),
    ]);

    const totalViews = storyStatsAgg[0]?.totalViews || 0;
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
      this.commentModel.countDocuments(),
      this.commentModel.countDocuments({ status: CommentStatus.VISIBLE }),
      this.commentModel.countDocuments({ status: CommentStatus.HIDDEN }),
      this.commentModel.countDocuments({ status: CommentStatus.DELETED }),
      this.ratingModel.countDocuments(),
      this.ratingModel.aggregate([
        {
          $group: {
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
          createdAt: { $gte: startOfDaysAgo },
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
          createdAt: { $gte: startOfDaysAgo },
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
          date: {
            $gte: startOfDaysAgo.toISOString().slice(0, 10),
          },
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

    for (let i = validDays - 1; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label = `${dd}/${mm}`;

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
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
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
    const topStoriesRaw = await this.storyModel
      .find({ status: StoryStatus.PUBLISHED })
      .populate('authorId', 'displayName username avatarUrl')
      .sort({ 'stats.viewCount': -1 })
      .limit(6)
      .lean();

    const topStories = topStoriesRaw.map((s: any) => ({
      _id: s._id.toString(),
      title: s.title,
      slug: s.slug,
      coverImage: s.coverImage || null,
      authorName: s.authorId?.displayName || s.authorId?.username || 'Tác giả',
      authorAvatar: s.authorId?.avatarUrl || null,
      views: s.stats?.viewCount || 0,
      likes: s.stats?.followCount || 0,
      chapterCount: s.stats?.chapterCount || 0,
      ratingAverage: s.stats?.ratingAverage || 5,
      ratingCount: s.stats?.ratingCount || 0,
    }));

    // 8. 6 GIAO DỊCH NẠP GẦN NHẤT
    const recentTransactionsRaw = await this.transactionModel
      .find()
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
        .find({ status: StoryStatus.PENDING_REVIEW })
        .populate('authorId', 'displayName username')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
      this.chapterModel
        .find({ status: ChapterStatus.PENDING_REVIEW })
        .populate('storyId', 'title')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
      this.authorRequestModel
        .find({ status: AuthorRequestStatus.PENDING })
        .populate('userId', 'displayName username email avatarUrl')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
    ]);

    return {
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
          totalViews,
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
