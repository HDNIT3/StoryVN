'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { discoveryService, type RankingMetric } from '@/features/stories/services/discovery.service';
import type { StoryViewTimeFrame } from '@/features/stories';

const METRICS: { key: RankingMetric; label: string; hint: string }[] = [
  { key: 'views', label: 'Lượt đọc', hint: 'Độc giả' },
  { key: 'follows', label: 'Theo dõi', hint: 'Cộng đồng' },
  { key: 'rating', label: 'Đánh giá', hint: 'Yêu thích' },
  { key: 'purchases', label: 'Mua chương', hint: 'Ủng hộ' },
  { key: 'revenue', label: 'Doanh thu', hint: 'Xu mở khóa' },
];

const PERIODS: { value: StoryViewTimeFrame; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
  { value: 'year', label: '365 ngày' },
  { value: 'all', label: 'Toàn thời gian' },
];

export function AuthorRankingsSection() {
  const [metric, setMetric] = useState<RankingMetric>('views');
  const [timeFrame, setTimeFrame] = useState<StoryViewTimeFrame>('month');
  const [dateMode, setDateMode] = useState<'recent' | 'day' | 'month' | 'year'>('recent');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['stories', 'rankings', 'authors', metric, timeFrame, dateMode, selectedDate, page],
    queryFn: async () =>
      (await discoveryService.authorRankings(metric, timeFrame, page, dateMode === 'recent' ? {} : {
        dateMode,
        [dateMode === 'day' ? 'date' : dateMode]: selectedDate,
      })).data,
    staleTime: 60_000,
    retry: 1,
  });
  const items = query.data?.items ?? [];
  const metricLabel = METRICS.find((item) => item.key === metric)?.label ?? '';

  const formatMetric = (value: number, count?: number) => {
    if (metric === 'rating') {
      return `★ ${value.toFixed(1)}${count ? ` · ${count.toLocaleString('vi-VN')} đánh giá` : ''}`;
    }
    const unit =
      metric === 'revenue'
        ? 'Xu'
        : metric === 'views'
          ? 'lượt đọc'
          : metric === 'follows'
            ? 'theo dõi mới'
            : 'lượt mua chương';
    return `${value.toLocaleString('vi-VN')} ${unit}`;
  };

  return (
    <section aria-labelledby="author-rankings-title" className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50/70 px-4 py-3 sm:px-5">
          <h2 id="author-rankings-title" className="text-sm font-bold text-slate-800">
            Tôn vinh tác giả
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Chọn tiêu chí và khoảng thời gian để xem những cây bút nổi bật
          </p>
        </div>
        <div
          className="flex snap-x gap-2 overflow-x-auto p-3 sm:p-4"
          role="group"
          aria-label="Chọn tiêu chí xếp hạng tác giả"
        >
          {METRICS.map(({ key, label, hint }) => {
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
                className={`flex min-h-[68px] min-w-[148px] snap-start items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:min-w-0 sm:flex-1 ${
                  active
                    ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/70'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                    active ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {key === 'views' ? '◉' : key === 'follows' ? '＋' : key === 'rating' ? '★' : '◆'}
                </span>
                <span>
                  <span className="block whitespace-nowrap text-sm font-bold">{label}</span>
                  <span className={`mt-0.5 block whitespace-nowrap text-[11px] ${active ? 'text-amber-100' : 'text-slate-500'}`}>
                    {hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
            Khoảng thời gian
            <select
              aria-label="Khoảng thời gian xếp hạng tác giả"
              value={timeFrame}
              onChange={(event) => {
                setTimeFrame(event.target.value as StoryViewTimeFrame);
                setDateMode('recent');
                setPage(1);
              }}
              className="min-h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            >
              {PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
            Chọn cụ thể
            <select aria-label="Kiểu lọc ngày tác giả" value={dateMode} onChange={(event) => { setDateMode(event.target.value as typeof dateMode); setSelectedDate(''); setPage(1); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <option value="recent">Khoảng nhanh</option><option value="day">Ngày</option><option value="month">Tháng</option><option value="year">Năm</option>
            </select>
            {dateMode !== 'recent' && <input aria-label={`Chọn ${dateMode}`} type={dateMode === 'day' ? 'date' : dateMode === 'month' ? 'month' : 'number'} min={dateMode === 'year' ? '2000' : undefined} max={dateMode === 'year' ? String(new Date().getFullYear()) : undefined} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }} className="min-h-11 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700" />}
          </label>
          <div className="flex items-center gap-2 self-start text-sm sm:self-auto">
            <button
              type="button"
              disabled={page === 1 || query.isFetching}
              onClick={() => setPage((value) => value - 1)}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <span aria-live="polite" className="min-w-16 text-center font-semibold tabular-nums text-slate-500">
              Trang {page}
            </span>
            <button
              type="button"
              disabled={!query.data?.hasNextPage || query.isFetching}
              onClick={() => setPage((value) => value + 1)}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {query.isError && (
        <p role="status" className="text-sm text-rose-700">
          Chưa tải được bảng xếp hạng tác giả.{' '}
          <button type="button" onClick={() => void query.refetch()} className="font-semibold underline underline-offset-2">
            Thử lại
          </button>
        </p>
      )}

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Đang tải xếp hạng tác giả">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 3).map((author, index) => (
              <Link
                key={author._id}
                href={author.username ? `/tac-gia/${author.username}` : '/tac-gia'}
                className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_44px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_60px_-26px_rgba(245,158,11,0.25)]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                  #{author.rank}
                </span>
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                  {author.avatarUrl ? (
                    <Image src={author.avatarUrl} alt={author.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-bold text-amber-700">
                      {author.name.slice(0, 1).toLocaleUpperCase('vi-VN')}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-slate-900 group-hover:text-amber-700">
                    {author.name}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-amber-700">
                    {formatMetric(author.metricValue, author.metricCount)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {author.stats.storyCount.toLocaleString('vi-VN')} truyện · {author.stats.followerCount.toLocaleString('vi-VN')} người theo dõi
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {items.length > 3 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-slate-900">Các tác giả tiếp theo</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Xếp theo {metricLabel.toLocaleLowerCase('vi-VN')} trong khoảng thời gian đã chọn
                </p>
              </div>
              <ol start={(page - 1) * 10 + 4} className="divide-y divide-slate-100">
                {items.slice(3).map((author) => (
                  <li key={author._id}>
                    <Link
                      href={author.username ? `/tac-gia/${author.username}` : '/tac-gia'}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-amber-50/50 sm:gap-4 sm:px-5"
                    >
                      <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-slate-400">{author.rank}</span>
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-amber-50">
                        {author.avatarUrl ? (
                          <Image src={author.avatarUrl} alt={author.name} fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-bold text-amber-700">{author.name.slice(0, 1).toLocaleUpperCase('vi-VN')}</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{author.name}</span>
                      <span className="shrink-0 text-right text-sm font-semibold text-slate-600">{formatMetric(author.metricValue, author.metricCount)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        !query.isError && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="font-semibold text-slate-800">Chưa có dữ liệu xếp hạng tác giả</p>
            <p className="mt-1 text-sm text-slate-500">Thử chọn khoảng thời gian khác để khám phá thêm.</p>
          </div>
        )
      )}
    </section>
  );
}
