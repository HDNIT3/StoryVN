"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useForumMutation } from "../queries/useForumQueries";
import type { ForumPost } from "../types";
import { ForumBanner } from "./ForumShared";
import { ForumEditor, type ForumEditorHandle } from "./ForumEditor";
import { plainToHtml } from "./ForumContent";

export function ForumPostForm({ post }: { post?: ForumPost }) {
  const router = useRouter();
  const { user } = useAuth();
  const saveLock = useRef(false);
  const mutation = useForumMutation();
  const editorRef = useRef<ForumEditorHandle>(null);
  const [title, setTitle] = useState(post?.title || "");
  const [content] = useState(post?.contentFormat === "html" ? post.content : post ? plainToHtml(post.content) : "");
  const editorKey = post?._id || "new";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saveLock.current || !user || (post && post.userId?._id !== user._id) || !editorRef.current || !title.trim()) return;
    saveLock.current = true;
    setSaving(true); setError(""); mutation.reset();
    try { const html = await editorRef.current.prepare(); await mutation.mutateAsync(post ? { type: "update", id: post._id, input: { title: title.trim(), content: html, contentFormat: "html" } } : { type: "create", input: { title: title.trim(), content: html, contentFormat: "html" } }); router.push("/tai-khoan/bai-viet"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu bài viết. Nội dung được giữ nguyên, vui lòng thử lại."); }
    finally { editorRef.current?.unlock(); saveLock.current = false; setSaving(false); }
  }
  const busy = saving || mutation.isPending;
  return <div className="mx-auto max-w-4xl space-y-7 px-4 py-8 sm:px-6"><ForumBanner eyebrow="StoryVN · Góc của bạn" title={post ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"} description="Viết rõ ràng, thêm định dạng khi cần và lưu bài viết khi nội dung đã sẵn sàng." /><form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">{post ? "Nội dung bài viết" : "Bắt đầu chia sẻ"}</h2>
        <Link href="/tai-khoan/bai-viet" className="text-sm font-semibold text-sky-700 hover:underline">
          Quay lại danh sách
        </Link>
      </div>

      {post ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-800">
          ⚠️ <strong>Lưu ý:</strong> Sau khi bạn lưu chỉnh sửa, bài viết sẽ được chuyển về trạng thái <strong>Chờ duyệt lại</strong> trước khi tiếp tục hiển thị trên diễn đàn.
        </div>
      ) : (
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs font-medium text-sky-800">
          📌 <strong>Lưu ý:</strong> Bài viết mới sau khi đăng sẽ được đưa vào hàng đợi <strong>Chờ duyệt</strong> và hiển thị công khai sau khi ban quản trị phê duyệt.
        </div>
      )}

      {post?.status === "HIDDEN" && (
        <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
          Bài viết đang ở trạng thái ẩn. Bạn có thể cập nhật nội dung để ban quản trị xem xét duyệt lại.
        </p>
      )}<div><label htmlFor="forum-title" className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề</label><input id="forum-title" required maxLength={200} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" /><p className="mt-2 text-right text-xs text-slate-400">{title.length}/200</p></div><div><p className="mb-2 text-sm font-semibold text-slate-700">Nội dung</p><ForumEditor key={editorKey} initialHtml={content} disabled={busy} editorRef={editorRef} /></div>{(error || mutation.isError) && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error || mutation.error?.message || "Không thể lưu thay đổi."}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy} disabled={busy || !title.trim()}>{saving ? "Đang lưu bài viết…" : post ? "Lưu thay đổi" : "Đăng bài"}</Button><Link href="/tai-khoan/bai-viet" className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</Link></div></form></div>;
}
