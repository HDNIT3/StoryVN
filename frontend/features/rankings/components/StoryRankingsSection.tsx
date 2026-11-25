'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TopViewStoryItem, StoryViewTimeFrame } from '@/features/stories';
import {
  discoveryService,
  type RankingMetric,
} from '@/features/stories/services/discovery.service';
import { StoryRankingResults } from './StoryRankingResults';

const METRICS: Record<
  RankingMetric,
  { label: string; eyebrow: string; title: string; unit: string }
> = {
  views: {
    label: 'Lượt đọc',
    eyebrow: 'Phổ biến',
    title: 'Top truyện nhiều lượt đọc',
    unit: 'lượt đọc',
  },
  follows: {
    label: 'Theo dõi',
    eyebrow: 'Được quan tâm',
    title: 'Top truyện được theo dõi',
    unit: 'người theo dõi',
  },
  rating: {
    label: 'Đánh giá',
    eyebrow: 'Độc giả yêu thích',
    title: 'Top truyện được đánh giá cao',
    unit: 'sao',
  },
  purchases: {
    label: 'Mua chương',
    eyebrow: 'Giao dịch',
    title: 'Top truyện được mua chương',
    unit: 'lượt mua chương',
  },
  revenue: {
    label: 'Doanh thu',
    eyebrow: 'Xu từ mở khóa',
    title: 'Top truyện có doanh thu cao',
    unit: 'Xu',
  },
};

const METRIC_KEYS = Object.keys(METRICS) as RankingMetric[];

function RankingMetricIcon({ metric }: { metric: RankingMetric }) {
  const common = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (metric === 'views') {
    return (
      <svg {...common}>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (metric === 'follows') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 8v6m3-3h-6" />
      </svg>
    );
  }
  if (metric === 'rating') {
    return (
      <svg {...common}>
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
      <circle cx="17" cy="17" r="3" fill="currentColor" stroke="white" />
    </svg>
  );
}

export function StoryRankingsSection() {
  const [metric, setMetric] = useState<RankingMetric>('views');
  const [timeFrame, setTimeFrame] = useState<StoryViewTimeFrame>('all');
  const [dateMode, setDateMode] = useState<'recent' | 'day' | 'month' | 'year'>('recent');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['stories', 'rankings', metric, timeFrame, dateMode, selectedDate, page],
    queryFn: async () =>
      (await discoveryService.rankings(metric, timeFrame, page, dateMode === 'recent' ? {} : {
        dateMode,
        [dateMode === 'day' ? 'date' : dateMode]: selectedDate,
      })).data,
    staleTime: 60_000,
    retry: 1,
  });
  const items: TopViewStoryItem[] =
    query.data?.items.map((item) => ({
      _id: item._id,
      title: item.title,
      slug: item.slug,
      coverUrl: item.coverUrl,
      author: item.author.name,
      viewCount: item.metricValue,
    })) ?? [];
  const config = METRICS[metric];
  const description =
    metric === 'rating'
      ? 'Xếp hạng có cân nhắc số lượt đánh giá; hiển thị điểm trung bình thực tế.'
      : metric === 'follows'
        ? 'Số người đang theo dõi truyện tại thời điểm hiện tại.'
        : metric === 'purchases'
          ? 'Số lần mua chương bằng Xu thành công trong khoảng thời gian đã chọn.'
          : metric === 'revenue'
            ? 'Tổng số Xu thu được từ các lượt mở khóa chương trả phí trong khoảng thời gian đã chọn.'
          : 'Các truyện được đọc nhiều nhất trong khoảng thời gian đã chọn.';

  return (
    <StoryRankingResults
      topStories={items}
      isLoading={!query.data && !query.isError && query.isPending}
      title={config.title}
      description={description}
      valueLabel={config.unit}
      rankOffset={(page - 1) * 10}
      formatValue={(story) => {
        if (metric !== 'rating') return story.viewCount.toLocaleString('vi-VN');
        const count =
          query.data?.items.find((item) => item._id === story._id)?.metricCount ??
          query.data?.items.find((item) => item._id === story._id)?.stats.ratingCount ??
          0;
        return `${story.viewCount.toFixed(1)} (${count.toLocaleString('vi-VN')} đánh giá)`;
      }}
      controls={
        <div className="mb-6 space-y-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl">
            <div className="flex flex-col gap-1 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Khám phá bảng xếp hạng
                </p>
              <p className="mt-0.5 text-xs text-slate-500">
                  Chọn cách bạn muốn khám phá truyện nổi bật
                </p>
              </div>
              <span className="hidden rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-sky-700 sm:inline-flex">
                4 tiêu chí
              </span>
            </div>

            <div
              className="flex snap-x gap-2 overflow-x-auto p-3 sm:p-4"
              role="group"
              aria-label="Chọn tiêu chí bảng xếp hạng"
            >
              {METRIC_KEYS.map((key) => {
                const active = metric === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setMetric(key);
                      setPage(1);
                    }}
                    className={`group flex min-h-[68px] min-w-[148px] snap-start items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:min-w-0 sm:flex-1 ${
                      active
                        ? 'border-sky-500 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/70'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        active
                          ? 'bg-white/15 text-white ring-1 ring-white/20'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-sky-600'
                      }`}
                    >
                      <RankingMetricIcon metric={key} />
                    </span>
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-sm font-bold">
                        {METRICS[key].label}
                      </span>
                      <span
                        className={`mt-0.5 block whitespace-nowrap text-[11px] ${
                          active ? 'text-sky-100' : 'text-slate-500'
                        }`}
                      >
                        {METRICS[key].eyebrow}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                <span className="whitespace-nowrap">Khoảng thời gian</span>
                <select
                  aria-label="Thời gian xếp hạng"
                  value={timeFrame}
                  onChange={(event) => {
                    setTimeFrame(event.target.value as StoryViewTimeFrame);
                    setDateMode('recent');
                    setPage(1);
                  }}
                  className="min-h-11 min-w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">7 ngày</option>
                  <option value="month">30 ngày</option>
                  <option value="year">365 ngày</option>
                </select>
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                <span className="whitespace-nowrap">Hoặc chọn cụ thể</span>
                <select aria-label="Kiểu lọc ngày cụ thể" value={dateMode} onChange={(event) => { setDateMode(event.target.value as typeof dateMode); setSelectedDate(''); setPage(1); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                  <option value="recent">Khoảng nhanh</option><option value="day">Ngày</option><option value="month">Tháng</option><option value="year">Năm</option>
                </select>
                {dateMode !== 'recent' && <input aria-label={`Chọn ${dateMode}`} type={dateMode === 'day' ? 'date' : dateMode === 'month' ? 'month' : 'number'} min={dateMode === 'year' ? '2000' : undefined} max={dateMode === 'year' ? String(new Date().getFullYear()) : undefined} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }} className="min-h-11 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700" />}
              </label>

              <div className="flex items-center gap-2 self-start text-sm sm:self-auto">
                <button
                  type="button"
                  disabled={page === 1 || query.isFetching}
                  onClick={() => setPage((value) => value - 1)}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>
                <span
                  aria-live="polite"
                  className="min-w-16 text-center font-semibold tabular-nums text-slate-500"
                >
                  Trang {page}
                </span>
                <button
                  type="button"
                  disabled={!query.data?.hasNextPage || query.isFetching}
                  onClick={() => setPage((value) => value + 1)}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>

          {query.isError && (
            <p role="status" className="text-sm text-slate-500">
              Chưa tải được bảng xếp hạng.{' '}
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="font-semibold text-sky-700 underline underline-offset-2"
              >
                Thử lại
              </button>
            </p>
          )}
        </div>
      }
    />
  );
}
