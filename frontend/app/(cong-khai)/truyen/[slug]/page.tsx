import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryDetailView, type StoryDetailData } from "@/features/stories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type StoryFetchResult =
  | { status: "ok"; story: StoryDetailData }
  | { status: "not-found" }
  | { status: "error" };

// Hàm lấy thông tin cơ bản của truyện từ API ở phía máy chủ (Server-side)
async function getStory(slug: string): Promise<StoryFetchResult> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${apiUrl}/stories/${slug}`, {
      next: { revalidate: 60 }, // Cache 60s để tăng tốc độ và giảm tải cho backend
    });

    if (res.status === 404) return { status: "not-found" };
    if (!res.ok) return { status: "error" };

    const json = await res.json();
    const story = json?.data as StoryDetailData | undefined;
    return story ? { status: "ok", story } : { status: "not-found" };
  } catch {
    return { status: "error" };
  }
}

// ═══════════════════════════════════════════════════════════════
// TỰ ĐỘNG SINH METADATA & OPEN GRAPH (Zalo, Facebook, Telegram...)
// ═══════════════════════════════════════════════════════════════
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStory(slug);

  if (result.status !== "ok") {
    return {
      title: "Không tìm thấy tác phẩm | StoryVN",
      description: "Tác phẩm không tồn tại hoặc chưa được xuất bản công khai.",
    };
  }

  const story = result.story;
  const authorName =
    story.author?.penName ||
    story.author?.displayName ||
    story.author?.name ||
    story.author?.username ||
    "Tác giả StoryVN";

  const title = `${story.title} - Tác giả ${authorName}`;
  const plainDesc = story.description
    ? story.description.replace(/\s+/g, " ").trim().slice(0, 160)
    : `Đọc truyện "${story.title}" của tác giả ${authorName} tại StoryVN. Đọc truyện chữ online chất lượng cao.`;

  const coverUrl = story.coverUrl || "/icon/iconweb.png";

  return {
    title: `${title} | StoryVN`,
    description: plainDesc,
    openGraph: {
      title,
      description: plainDesc,
      url: `/truyen/${slug}`,
      siteName: "StoryVN",
      type: "article",
      authors: [authorName],
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 1200,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: plainDesc,
      images: [coverUrl],
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SERVER COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════════════
export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getStory(slug);

  // URL truyện không tồn tại (hoặc chưa xuất bản công khai) → trang 404
  if (result.status === "not-found") {
    notFound();
  }

  return <StoryDetailView slug={slug} />;
}
