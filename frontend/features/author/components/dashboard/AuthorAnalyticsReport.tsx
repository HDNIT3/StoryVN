"use client";

import { useState } from "react";
import {
  DateRangeToolbar,
  exportStatisticsData,
  type useDateRange,
} from "@/components/statistics";
import { useAuthorAnalytics } from "../../queries/useAuthorQueries";
import type { AuthorAnalyticsData } from "../../types/analytics.types";
import { AuthorAnalyticsPanel } from "./AuthorAnalyticsPanel";
import { toast } from "@/lib/toast";

export function AuthorAnalyticsReport({
  dateRange,
  storyId,
  onSelectStory,
}: {
  dateRange: ReturnType<typeof useDateRange>;
  storyId?: string;
  onSelectStory?: (story: AuthorAnalyticsData["stories"][number]) => void;
}) {
  const [exporting, setExporting] = useState(false);
  const { data, isPending, isFetching, isError, refetch } = useAuthorAnalytics(
    dateRange.range,
    storyId,
    dateRange.isValid,
  );
  const ready = !!data && !isFetching && !isError && dateRange.isValid;
  const exportData = async (format: "xlsx" | "csv" = "xlsx") => {
    if (!data || !ready || exporting) return;
    setExporting(true);
    try {
      await exportStatisticsData(
        {
          filename: storyId ? "thong-ke-tac-pham" : "tong-quan-tac-gia",
          range: dateRange.range,
          notes: [
            "Lượt đọc trong kỳ theo StoryDailyView; xu theo giá thực trả và ngày mở khóa. Bình luận, đánh giá chỉ tính bản ghi đang hiển thị.",
            "Điểm trung bình tính theo số lượt đánh giá, không lấy trung bình các điểm của từng truyện. Chưa có đánh giá được để trống.",
            "Theo dõi là bản ghi còn hiệu lực; không phải lịch sử theo dõi đã hủy. Số liệu hiện tại/toàn thời gian được ghi rõ trong tên cột.",
          ],
          sheets: [
            {
              name: "Trong kỳ",
              columns: ["Chỉ số", "Giá trị"],
              rows: Object.entries(data.period).map(([key, value]) => [
                key,
                value ?? "",
              ]),
            },
            {
              name: "Hiện tại",
              columns: ["Chỉ số", "Giá trị"],
              rows: Object.entries(data.snapshot).map(([key, value]) => [
                key,
                value ?? "",
              ]),
            },
            {
              name: "Theo ngày",
              columns: [
                "Ngày",
                "Truyện mới",
                "Chương mới",
                "Lượt đọc",
                "Bình luận",
                "Đánh giá",
                "Theo dõi còn hiệu lực",
                "Mở khóa",
                "Xu",
              ],
              rows: data.timeline.map((point) => [
                point.date,
                point.stories,
                point.chapters,
                point.views,
                point.comments,
                point.ratings,
                point.follows,
                point.unlocks,
                point.coins,
              ]),
            },
            {
              name: "Theo tác phẩm",
              columns: [
                "Truyện",
                "Trạng thái hiện tại",
                "Lượt đọc trong kỳ",
                "Lượt đọc toàn thời gian",
                "Xu trong kỳ",
                "Bình luận trong kỳ",
                "Đánh giá trong kỳ",
                "Điểm hiện tại",
                "Số đánh giá hiện tại",
                "Theo dõi hiện tại",
                "Tổng chương",
              ],
              rows: data.stories.map((row) => [
                row.title,
                row.status,
                row.views,
                row.totalViews,
                row.coins,
                row.comments,
                row.ratings,
                row.ratingAverage ?? "",
                row.ratingCount,
                row.followers,
                row.totalChapters,
              ]),
            },
            {
              name: "Theo chương",
              columns: [
                "Mã truyện",
                "Chương",
                "Tiêu đề",
                "Trạng thái hiện tại",
                "Lượt đọc toàn thời gian",
                "Số từ",
                "Mở khóa trong kỳ",
                "Xu trong kỳ",
              ],
              rows: data.chapters.map((row) => [
                row.storyId,
                row.chapterNumber,
                row.title,
                row.status,
                row.totalViews,
                row.words,
                row.unlocks,
                row.coins,
              ]),
            },
            {
              name: "Phân bố sao",
              columns: ["Sao", "Trong kỳ", "Toàn thời gian"],
              rows: data.distribution.map((item, index) => [
                item.stars,
                item.count,
                data.snapshotDistribution[index].count,
              ]),
            },
          ],
        },
        format,
      );
    } catch {
      toast.error("Không thể xuất thống kê. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="space-y-5">
      <DateRangeToolbar
        dateRange={dateRange}
        onExport={exportData}
        exportDisabled={!ready}
        exporting={exporting}
      />
      {!dateRange.isValid ? (
        <p role="status" className="text-sm text-slate-500">
          Chọn khoảng thời gian hợp lệ để xem thống kê.
        </p>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          Không thể tải thống kê.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      ) : isPending ? (
        <div
          role="status"
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
        >
          Đang tổng hợp số liệu...
        </div>
      ) : (
        data && (
          <div aria-busy={isFetching}>
            <AuthorAnalyticsPanel
              data={data}
              detail={!!storyId}
              onSelectStory={onSelectStory}
            />
          </div>
        )
      )}
    </div>
  );
}
