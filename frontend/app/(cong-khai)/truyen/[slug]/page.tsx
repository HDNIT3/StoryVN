import type { Metadata } from "next";
import StoryDetailClient from "./story-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Hàm lấy thông tin cơ bản của truyện từ API ở phía máy chủ (Server-side)
async function getStory(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${apiUrl}/stories/${slug}`, {
      next: { revalidate: 60 }, // Cache 60s để tăng tốc độ và giảm tải cho backend
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TỰ ĐỘNG SINH METADATA & OPEN GRAPH (Zalo, Facebook, Telegram...)
// ═══════════════════════════════════════════════════════════════
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);

  if (!story) {
    return {
      title: "Chi tiết tác phẩm | StoryVN",
      description: "Đọc truyện online tại nền tảng sáng tác StoryVN.",
    };
  }

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
  return <StoryDetailClient slug={slug} />;
}
