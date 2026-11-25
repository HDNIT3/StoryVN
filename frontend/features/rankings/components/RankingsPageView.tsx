'use client';

import { useState } from 'react';
import { AuthorRankingsSection } from './AuthorRankingsSection';
import { StoryRankingsSection } from './StoryRankingsSection';

type RankingTarget = 'stories' | 'authors';

export function RankingsPageView() {
  const [target, setTarget] = useState<RankingTarget>('stories');

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-16">
      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white px-6 py-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)] sm:px-10 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Khám phá cộng đồng StoryVN
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Bảng xếp hạng
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Theo dõi những truyện và tác giả được yêu thích theo lượt đọc, lượt theo dõi, đánh giá và mua chương.
            </p>
          </div>
        </header>

        <div
          role="group"
          aria-label="Chọn loại bảng xếp hạng"
          className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm sm:inline-flex"
        >
          {([
            ['stories', 'Xếp hạng truyện', 'Tác phẩm nổi bật'],
            ['authors', 'Xếp hạng tác giả', 'Những cây bút nổi bật'],
          ] as const).map(([key, label, hint]) => {
            const active = target === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setTarget(key)}
                className={`flex min-h-14 min-w-[190px] flex-1 items-center gap-3 rounded-xl px-4 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:flex-none ${
                  active
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-black ${active ? 'bg-white/10 text-sky-200' : 'bg-slate-100 text-slate-500'}`}>
                  {key === 'stories' ? '▤' : '✦'}
                </span>
                <span>
                  <span className="block whitespace-nowrap text-sm font-bold">{label}</span>
                  <span className={`mt-0.5 block whitespace-nowrap text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                    {hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {target === 'stories' ? <StoryRankingsSection /> : <AuthorRankingsSection />}
      </div>
    </div>
  );
}
