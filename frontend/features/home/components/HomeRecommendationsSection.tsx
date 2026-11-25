'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRecommendations } from '@/features/stories/queries/useRecommendations';
import { useAuth } from '@/lib/context/AuthContext';

/** Optional enhancement: existing homepage stays available during loading or failure. */
export function HomeRecommendationsSection({ recommendations }: { recommendations: ReturnType<typeof useRecommendations> }) {
  const { isAuthenticated } = useAuth();
  const { data, isPending, isError, isFetching, refetch } = recommendations;
  if (!isAuthenticated) return null;
  if (!data?.items.length) {
    return (
      <section aria-label="Gợi ý dành cho bạn" className="rounded-2xl border border-slate-200 px-5 py-4 text-sm text-slate-500">
        <p role="status">{isPending ? 'Đang tìm truyện phù hợp với bạn…' : isError ? 'Chưa tải được gợi ý cá nhân. Những truyện bên trên đang là danh sách chung.' : 'Hiện chưa có thêm truyện phù hợp để gợi ý.'}</p>
        {isError && <button type="button" disabled={isFetching} onClick={() => void refetch()} className="mt-2 min-h-11 font-semibold text-sky-700 underline disabled:opacity-50">Thử lại</button>}
      </section>
    );
  }
  return (
    <section aria-labelledby="recommendations-heading" className="space-y-4">
      <div>
        <h2 id="recommendations-heading" className="text-2xl font-bold text-slate-900">
          {data.personalized ? 'Gợi ý dành cho bạn' : 'Có thể bạn sẽ thích'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {data.personalized ? 'Những tác phẩm phù hợp với sở thích đọc của bạn.' : 'Chưa đủ thông tin về sở thích của bạn. Hãy đọc hoặc theo dõi truyện yêu thích để gợi ý phù hợp hơn.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.items.map(story => (
          <Link key={story._id} href={`/truyen/${story.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-3 hover:border-sky-300 focus-visible:outline-2 focus-visible:outline-sky-600">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
              {story.coverUrl && <Image src={story.coverUrl} alt={story.title} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw" className="object-cover" />}
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-sky-700">{story.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">{story.author.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
