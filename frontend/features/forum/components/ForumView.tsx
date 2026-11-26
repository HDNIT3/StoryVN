"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import { useForumPosts, useLikePost } from "../queries/useForumQueries";
import { ForumAuthor, ForumBanner, ForumError, ForumPagination } from "./ForumShared";
import { ForumContent } from "./ForumContent";
import { ForumShareModal } from "./ForumShareModal";
import { ReportContentModal } from "@/features/reports";
import type { ForumPost } from "../types";

type SortMode = "NEWEST" | "POPULAR" | "DISCUSSED";

function ForumCard({
  post,
  onSharePost,
  onReportPost,
}: {
  post: ForumPost;
  onSharePost: (post: ForumPost, onUpdated: (count?: number) => void) => void;
  onReportPost: (post: ForumPost) => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const likeMutation = useLikePost();
  const [localLike, setLocalLike] = useState({
    liked: !!post.likedByMe,
    count: post.likeCount ?? 0,
  });
  const [localShareCount, setLocalShareCount] = useState(post.shareCount ?? 0);

  const isOwner = Boolean(user?._id && post.userId?._id === user._id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thích bài viết.");
      return;
    }
    const nextLiked = !localLike.liked;
    const nextCount = nextLiked ? localLike.count + 1 : Math.max(0, localLike.count - 1);
    setLocalLike({ liked: nextLiked, count: nextCount });
    likeMutation.mutate({ id: post._id, isLiked: localLike.liked });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSharePost(post, (newCount) => {
      if (typeof newCount === "number") {
        setLocalShareCount(newCount);
      } else {
        setLocalShareCount((prev) => prev + 1);
      }
    });
  };

  return (
    <article className="group space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-sky-200 hover:shadow-md sm:p-6">
      {/* Header Author & Views */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <ForumAuthor post={post} />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1" title="Lượt xem bài viết">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="whitespace-nowrap">{(post.viewCount ?? 0).toLocaleString("vi-VN")} <span className="hidden sm:inline">lượt xem</span></span>
          </div>

          {!isOwner && (
            <button
              type="button"
              onClick={() => onReportPost(post)}
              className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition cursor-pointer"
              title="Báo cáo bài viết vi phạm"
              aria-label="Báo cáo bài viết"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <Link href={`/dien-dan/${post.slug || post._id}`} className="block group-hover:text-sky-600 transition">
        <h3 className="break-words text-lg sm:text-xl font-bold leading-7 text-slate-900 group-hover:text-sky-600 transition">
          {post.title}
        </h3>
      </Link>

      {/* Content Preview */}
      <Link href={`/dien-dan/${post.slug || post._id}`} className="block">
        <ForumContent post={post} preview={280} />
      </Link>

      {/* Footer bar with Likes, Comments, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-medium text-slate-600">
          {/* Like button */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition cursor-pointer ${
              localLike.liked
                ? "bg-sky-50 text-sky-700 font-bold border border-sky-200/70"
                : "hover:bg-slate-100 hover:text-slate-900 border border-transparent"
            }`}
            title={localLike.liked ? "Bỏ thích" : "Thích bài viết"}
          >
            <svg
              className={`h-4 w-4 ${localLike.liked ? "fill-current text-sky-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>{localLike.count.toLocaleString("vi-VN")} Thích</span>
          </button>

          {/* Comment link button */}
          <Link
            href={`/dien-dan/${post.slug || post._id}#forum-comments`}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
            title="Xem và viết bình luận"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{(post.commentCount ?? 0).toLocaleString("vi-VN")} Bình luận</span>
          </Link>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            title="Chia sẻ bài viết"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{localShareCount.toLocaleString("vi-VN")} Chia sẻ</span>
          </button>
        </div>

        <Link
          href={`/dien-dan/${post.slug || post._id}`}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          Đọc chi tiết →
        </Link>
      </div>
    </article>
  );
}

export function ForumView() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [sharingState, setSharingState] = useState<{
    post: ForumPost;
    onUpdated: (count?: number) => void;
  } | null>(null);
  const [reportingPost, setReportingPost] = useState<ForumPost | null>(null);

  const posts = useForumPosts("feed", page);

  const displayedPosts = useMemo(() => {
    const rawItems = posts.data?.items ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rawItems.filter((item) => {
          const inTitle = item.title.toLowerCase().includes(q);
          const inAuthor = (
            item.userId?.displayName ||
            ""
          )
            .toLowerCase()
            .includes(q);
          return inTitle || inAuthor;
        })
      : [...rawItems];

    if (sortMode === "POPULAR") {
      filtered.sort(
        (a, b) =>
          (b.likeCount ?? 0) * 3 +
          (b.viewCount ?? 0) -
          ((a.likeCount ?? 0) * 3 + (a.viewCount ?? 0))
      );
    } else if (sortMode === "DISCUSSED") {
      filtered.sort(
        (a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0)
      );
    }
    return filtered;
  }, [posts.data?.items, search, sortMode]);

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      <ForumBanner
        eyebrow="StoryVN · Diễn đàn cộng đồng"
        title="Câu chuyện ngoài trang sách"
        description="Góc giao lưu, chia sẻ cảm nhận giữa độc giả và tác giả, cùng thảo luận về tác phẩm và thế giới văn học."
      />

      <div className="grid items-start gap-7 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 space-y-5">
          {/* Toolbar: Tabs, Search & Quick Create */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSortMode("NEWEST")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    sortMode === "NEWEST"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  Mới nhất ({posts.data?.pagination.total ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("POPULAR")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    sortMode === "POPULAR"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  Nổi bật nhất
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("DISCUSSED")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    sortMode === "DISCUSSED"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  Sôi nổi thảo luận
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bài viết, tác giả..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {posts.isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-28 rounded bg-slate-200" />
                      <div className="h-2.5 w-20 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-16 w-full rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : posts.isError ? (
            <ForumError retry={() => void posts.refetch()} />
          ) : (
            <>
              {displayedPosts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {search
                      ? `Không tìm thấy bài viết nào khớp với "${search}"`
                      : "Chưa có bài viết nào được xuất bản."}
                  </p>
                  <p className="text-xs text-slate-500">
                    Hãy là người đầu tiên chia sẻ cảm nhận và câu chuyện của bạn!
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {displayedPosts.map((post) => (
                  <ForumCard
                    key={post._id}
                    post={post}
                    onSharePost={(p, cb) => setSharingState({ post: p, onUpdated: cb })}
                    onReportPost={(p) => setReportingPost(p)}
                  />
                ))}
              </div>
              <ForumPagination
                page={page}
                totalPages={posts.data.pagination.totalPages}
                disabled={posts.isFetching}
                onChange={setPage}
              />
            </>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-300">
              Góc của bạn
            </span>
            <h2 className="mt-2.5 text-xl font-bold">Bạn có điều muốn kể?</h2>
            <p className="mt-2.5 text-sm leading-6 text-slate-300">
              Một cuốn sách hay, một nhân vật đáng nhớ hay một ý tưởng sáng tác mới. Hãy chia sẻ cùng cộng đồng.
            </p>
            <Link
              href={
                isAuthenticated
                  ? "/tai-khoan/bai-viet/them-moi"
                  : "/dang-nhap?returnUrl=/tai-khoan/bai-viet/them-moi"
              }
              className="mt-5 block rounded-xl bg-sky-500 px-4 py-3 text-center text-sm font-bold text-white shadow-xs transition hover:bg-sky-400"
            >
              + Viết bài mới
            </Link>
            {isAuthenticated && (
              <Link
                href="/tai-khoan/bai-viet"
                className="mt-3 block rounded-xl border border-slate-700 py-2.5 text-center text-xs font-semibold text-sky-200 hover:bg-slate-800 transition"
              >
                Quản lý bài viết của tôi
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Cùng giữ diễn đàn văn minh
            </h2>
            <ul className="mt-3.5 space-y-2.5 text-xs leading-5 text-slate-600">
              <li>• Tôn trọng những góc nhìn và cảm nhận khác biệt.</li>
              <li>• Chia sẻ nội dung và hình ảnh lành mạnh, phù hợp.</li>
              <li>• Đánh dấu nội dung tiết lộ tình tiết (Spoiler) trong tiêu đề.</li>
              <li>• Mọi bài viết sẽ được kiểm duyệt để bảo vệ cộng đồng.</li>
            </ul>
            <Link
              href="/ho-tro?tab=report"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
            >
              Trung tâm hỗ trợ & Báo cáo vi phạm →
            </Link>
          </div>
        </aside>
      </div>

      {/* Share Modal */}
      {sharingState && (
        <ForumShareModal
          isOpen={Boolean(sharingState)}
          onClose={() => setSharingState(null)}
          post={sharingState.post}
          onShareSuccess={(newCount) => {
            sharingState.onUpdated(newCount);
          }}
        />
      )}

      {/* Report Modal */}
      {reportingPost && (
        <ReportContentModal
          isOpen={Boolean(reportingPost)}
          onClose={() => setReportingPost(null)}
          targetType="FORUM_POST"
          targetId={reportingPost._id}
          targetTitle={reportingPost.title}
        />
      )}
    </div>
  );
}
