"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMyStoryDetail } from "@/lib/hooks/queries/useStoryQuery";
import { StoryStepForm } from "@/components/author/stories/StoryStepForm";

export default function ChinhSuaTacPhamPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug || params?.id) as string;

  const { data: story, isLoading, isError } = useMyStoryDetail(slug);

  // If accessed by MongoDB ObjectId or different key, silently update URL to clean slug
  useEffect(() => {
    if (story?.slug && slug !== story.slug) {
      router.replace(`/tac-gia/tac-pham/chinh-sua/${story.slug}`);
    }
  }, [story?.slug, slug, router]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-500">Đang tải thông tin tác phẩm...</p>
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-base font-bold text-zinc-900 mb-2">
          Không tìm thấy tác phẩm
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Tác phẩm này không tồn tại hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/tac-gia/tac-pham"
          className="inline-flex px-3.5 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-md hover:bg-zinc-800 transition"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return <StoryStepForm isEdit={true} initialStory={story} />;
}
