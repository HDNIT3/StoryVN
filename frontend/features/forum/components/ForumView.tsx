"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import { useForumPosts, useLikePost, useSharePost } from "../queries/useForumQueries";
import { ForumAuthor, ForumBanner, ForumError, ForumPagination } from "./ForumShared";
import { ForumContent } from "./ForumContent";
import { triggerForumShare } from "../services/forum-share";
import type { ForumPost } from "../types";

function ForumCard({ post }: { post: ForumPost }) {
  const { isAuthenticated } = useAuth();
  const likeMutation = useLikePost();
  const shareMutation = useSharePost();
  const [localLike, setLocalLike] = useState({
    liked: !!post.likedByMe,
    count: post.likeCount ?? 0,
  });
  const [localShareCount, setLocalShareCount] = useState(post.shareCount ?? 0);

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
    triggerForumShare({
      id: post._id,
      title: post.title,
      isAuthenticated,
      shareMutation,
      onSuccess: (newCount) => {
        if (typeof newCount === "number") {
          setLocalShareCount(newCount);
        } else {
          setLocalShareCount((prev) => prev + 1);
        }
      },
    });
  };

  return (
    <article className="group space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-sky-200 hover:shadow-md sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <ForumAuthor post={post} />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem</span>
        </div>
      </div>

      <Link href={`/dien-dan/${post._id}`} className="block group-hover:text-sky-600 transition">
        <h3 className="break-words text-xl font-bold leading-7 text-slate-900 group-hover:text-sky-600 transition">
          {post.title}
        </h3>
      </Link>

      <Link href={`/dien-dan/${post._id}`} className="block">
        <ForumContent post={post} preview={280} />
      </Link>

      {/* Footer bar with Likes, Comments, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          {/* Like button (Thumbs Up) */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
              localLike.liked
                ? "bg-sky-50 text-sky-700 font-semibold"
                : "hover:bg-slate-50 hover:text-slate-900"
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
            <span>{localLike.count.toLocaleString("vi-VN")}</span>
          </button>

          {/* Comment icon button */}
          <Link
            href={`/dien-dan/${post._id}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-slate-50 hover:text-slate-900"
            title="Bình luận bài viết"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{(post.commentCount ?? 0).toLocaleString("vi-VN")}</span>
          </Link>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-slate-50 hover:text-slate-900"
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
            <span>{localShareCount.toLocaleString("vi-VN")}</span>
          </button>
        </div>

        <Link
          href={`/dien-dan/${post._id}`}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          Đọc tiếp →
        </Link>
      </div>
    </article>
  );
}

export function ForumView() {
  const [page, setPage] = useState(1);
  const posts = useForumPosts("feed", page);

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      <ForumBanner
        eyebrow="StoryVN · Diễn đàn cộng đồng"
        title="Câu chuyện ngoài trang sách"
        description="Góc giao lưu, chia sẻ cảm nhận giữa độc giả và tác giả, cùng thảo luận về tác phẩm và thế giới văn học."
      />

      <div className="grid items-start gap-7 lg:grid-cols-[1fr_280px]">
        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Bài viết mới nhất{" "}
              <span className="ml-2 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
                {posts.data?.pagination.total ?? "…"}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Góc chia sẻ cộng đồng</span>
          </div>

          {posts.isPending ? (
            <p role="status" className="text-sm text-slate-500">Đang tải bài viết...</p>
          ) : posts.isError ? (
            <ForumError retry={() => void posts.refetch()} />
          ) : (
            <>
              {posts.data.items.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
                  Chưa có bài viết nào được xuất bản.
                </p>
              )}
              <div className="space-y-4">
                {posts.data.items.map((post) => (
                  <ForumCard key={post._id} post={post} />
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
            <h2 className="mt-3 text-xl font-bold">Bạn có điều muốn kể?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Một cuốn sách hay, một nhân vật đáng nhớ hay một ý tưởng sáng tác mới. Hãy chia sẻ cùng cộng đồng.
            </p>
            <Link
              href="/tai-khoan/bai-viet/them-moi"
              className="mt-5 block rounded-xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-xs transition hover:bg-sky-400"
            >
              Viết bài mới
            </Link>
            <Link
              href="/tai-khoan/bai-viet"
              className="mt-3 block text-center text-sm text-sky-200 hover:underline"
            >
              Bài viết của tôi
            </Link>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-6">
            <h2 className="font-bold text-slate-800">Cùng giữ diễn đàn văn minh</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Tôn trọng những góc nhìn khác biệt.</li>
              <li>Chia sẻ nội dung và hình ảnh phù hợp.</li>
              <li>Đánh dấu nội dung tiết lộ tình tiết ngay trong tiêu đề.</li>
              <li>Mọi bài viết sẽ được kiểm duyệt trước khi hiển thị.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
