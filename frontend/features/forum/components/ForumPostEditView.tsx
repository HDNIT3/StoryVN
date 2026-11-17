"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useForumPost } from "../queries/useForumQueries";
import { ForumPostForm } from "./ForumPostForm";
import { ForumError } from "./ForumShared";

export function ForumPostEditView({ id }: { id: string }) {
  const router = useRouter(); const { user } = useAuth(); const query = useForumPost(id);
  const ownerId = typeof query.data?.userId === "object" ? query.data.userId?._id : query.data?.userId;
  useEffect(() => { if (query.data && user && ownerId !== user._id) router.replace("/tai-khoan/bai-viet"); }, [query.data, user, ownerId, router]);
  if (query.isPending) return <p role="status" className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">Đang tải bài viết...</p>;
  if (query.isError || !query.data) return <div className="mx-auto max-w-4xl px-4 py-10"><ForumError retry={() => void query.refetch()} /></div>;
  if (!user || ownerId !== user._id) return null;
  return <ForumPostForm key={`${user._id}-${id}`} post={query.data} />;
}
