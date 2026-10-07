import type { Metadata } from "next";
import StoryDetailClient from "./StoryDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://storyvn.eastasia.cloudapp.azure.com").replace(/\/$/, "");
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

  try {
    const res = await fetch(`${apiUrl}/public/stories/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: "Truyện không tồn tại - StoryVN",
        description: "Truyện bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.",
      };
    }

    const json = await res.json();
    const story = json?.data;

    if (!story) {
      return {
        title: "StoryVN — Đọc Truyện Online",
        description: "Nền tảng đọc truyện online",
      };
    }

    const title = `${story.title} — Đọc Truyện Online`;
    const rawDesc = story.description || `Đọc truyện ${story.title} online miễn phí tại StoryVN`;
    const cleanDesc = rawDesc
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    const description = cleanDesc.length > 200 ? `${cleanDesc.slice(0, 200)}...` : cleanDesc;

    // Chuẩn hóa ảnh đại diện để bot mạng xã hội (Facebook, Zalo) có thể cào được
    let coverUrl = story.coverUrl || "/icon/iconweb.png";
    if (coverUrl.startsWith("/")) {
      coverUrl = `${siteUrl}${coverUrl}`;
    }

    const canonicalUrl = `${siteUrl}/truyen/${slug}`;
    const authorName = story.author?.penName || story.author?.displayName || "Tác giả ẩn danh";

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${story.title} — StoryVN`,
        description,
        url: canonicalUrl,
        siteName: "StoryVN",
        type: "article",
        locale: "vi_VN",
        publishedTime: story.publishedAt || undefined,
        modifiedTime: story.updatedAt || undefined,
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
        title: `${story.title} — StoryVN`,
        description,
        images: [coverUrl],
      },
    };
  } catch (error) {
    console.error("[generateMetadata] Error fetching story detail:", error);
    return {
      title: "StoryVN — Đọc Truyện Online",
      description: "Nền tảng đọc truyện online phong phú và đặc sắc nhất",
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <StoryDetailClient initialSlug={slug} />;
}
