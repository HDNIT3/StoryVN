"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import {
  useForumPost,
  useLikePost,
  useViewPost,
} from "../queries/useForumQueries";
import { ForumAuthor, ForumError, ForumStatus } from "./ForumShared";
import { ForumContent } from "./ForumContent";
import { ForumShareModal } from "./ForumShareModal";
import { ForumCommentsSection } from "@/features/comments";
import { ReportContentModal } from "@/features/reports";

export function ForumDetailView({ id }: { id: string }) {
  const { user, isAuthenticated } = useAuth();
  const postQuery = useForumPost(id);
  const likeMutation = useLikePost();
  const viewMutation = useViewPost();

  const [reporting, setReporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [localLike, setLocalLike] = useState<{ liked: boolean; count: number } | null>(null);
  const [localShare, setLocalShare] = useState<number | null>(null);

  const post = postQuery.data;

  // Tự động tăng lượt xem khi đọc chi tiết
  useEffect(() => {
    if (id) {
      viewMutation.mutate(id);
    }
  }, [id]);

  useEffect(() => {
    if (post) {
      setLocalLike({
        liked: !!post.likedByMe,
        count: post.likeCount ?? 0,
      });
      setLocalShare(post.shareCount ?? 0);

      if (typeof window !== "undefined" && post.slug && id !== post.slug) {
        const cleanUrl = `/dien-dan/${post.slug}${window.location.search}${window.location.hash}`;
        window.history.replaceState(null, "", cleanUrl);
      }
    }
  }, [post, id]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thích bài viết.");
      return;
    }
    if (!localLike || !post) return;
    const nextLiked = !localLike.liked;
    const nextCount = nextLiked ? localLike.count + 1 : Math.max(0, localLike.count - 1);
    setLocalLike({ liked: nextLiked, count: nextCount });
    likeMutation.mutate({ id: post._id, isLiked: localLike.liked });
  };

  const scrollToComments = () => {
    const el = document.getElementById("forum-comments");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (postQuery.isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
          <div className="h-6 w-1/3 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (postQuery.isError || !post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <ForumError retry={() => void postQuery.refetch()} />
        <div className="mt-4">
          <Link href="/dien-dan" className="text-sm font-semibold text-sky-600 hover:underline">
            ← Quay lại diễn đàn
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(user?._id && post.userId?._id === user._id);

  return (
    <div className="mx-auto max-w-4xl space-y-7 px-4 py-8 sm:px-6">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dien-dan"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại Diễn đàn
        </Link>

        {isOwner && (
          <Link
            href={`/tai-khoan/bai-viet/${post.slug || post._id}/chinh-sua`}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            Chỉnh sửa bài viết
          </Link>
        )}
      </div>

      {/* Main Post Card */}
      <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-9">
        {/* Header meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <ForumAuthor post={post} />
          <div className="flex items-center gap-3">
            {isOwner && post.status !== "VISIBLE" && <ForumStatus status={post.status} />}
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem
            </span>
          </div>
        </div>

        {/* Warning if pending/rejected */}
        {post.status === "PENDING" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-800">
            Bài viết của bạn đang trong trạng thái <strong>Chờ quản trị viên phê duyệt</strong> trước khi hiển thị công khai.
          </div>
        )}
        {post.status === "REJECTED" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
            Bài viết này đã bị từ chối duyệt do không phù hợp quy định cộng đồng. Bạn có thể chỉnh sửa lại nội dung để gửi duyệt tiếp.
          </div>
        )}

        {/* Title */}
        <h1 className="break-words text-2xl font-extrabold leading-9 text-slate-900 sm:text-3xl">
          {post.title}
        </h1>

        {/* Full Content */}
        <div className="min-h-36 text-base leading-8 text-slate-800">
          <ForumContent post={post} />
        </div>

        {/* Interaction bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Like (Thumbs Up) */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                localLike?.liked
                  ? "border-sky-300 bg-sky-50 text-sky-700 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg
                className={`h-5 w-5 ${localLike?.liked ? "fill-current text-sky-600" : ""}`}
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
              <span>{localLike ? localLike.count.toLocaleString("vi-VN") : 0} Thích</span>
            </button>

            {/* Comment button */}
            <button
              type="button"
              onClick={scrollToComments}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{(post.commentCount ?? 0).toLocaleString("vi-VN")} Bình luận</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => setSharing(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>{localShare !== null ? localShare.toLocaleString("vi-VN") : 0} Chia sẻ</span>
            </button>
          </div>

          {/* Report */}
          {!isOwner && (
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span>Báo cáo bài viết</span>
            </button>
          )}
        </div>
      </article>

      {/* Bình luận bài viết diễn đàn */}
      {post.status === "VISIBLE" && (
        <ForumCommentsSection
          forumPostId={post._id}
          postAuthorId={post.userId?._id}
        />
      )}

      {/* Share Modal */}
      <ForumShareModal
        isOpen={sharing}
        onClose={() => setSharing(false)}
        post={{ _id: post._id, slug: post.slug, title: post.title }}
        onShareSuccess={(newCount) => {
          if (typeof newCount === "number") {
            setLocalShare(newCount);
          } else {
            setLocalShare((prev) => (prev ?? 0) + 1);
          }
        }}
      />

      {/* Report Modal */}
      <ReportContentModal
        isOpen={reporting}
        onClose={() => setReporting(false)}
        targetType="FORUM_POST"
        targetId={post._id}
        targetTitle={post.title}
      />
    </div>
  );
}
