import type { Metadata } from "next";
import { HomeView, type HomeViewInitialData } from "@/features/home";

export const metadata: Metadata = {
  title: "StoryVN - Thế giới truyện chữ & tiểu thuyết online",
  description: "Đọc truyện online hàng đầu với hàng ngàn tác phẩm cập nhật liên tục.",
};

async function fetchJsonSafe<T>(url: string): Promise<T | undefined> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data as T | undefined;
  } catch {
    return undefined;
  }
}

async function getHomeInitialData(): Promise<HomeViewInitialData> {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  ).replace(/\/$/, "");

  const [topStories, latestUpdatedData, newestRes, authorsRes] =
    await Promise.all([
      fetchJsonSafe<HomeViewInitialData["topStories"]>(
        `${apiUrl}/stories/top-views?limit=10`
      ),
      fetchJsonSafe<HomeViewInitialData["latestUpdatedData"]>(
        `${apiUrl}/stories/latest-updated?limit=12`
      ),
      fetchJsonSafe<{ items?: HomeViewInitialData["newestStories"] }>(
        `${apiUrl}/stories?sortBy=published&limit=10`
      ),
      fetchJsonSafe<{ items?: HomeViewInitialData["featuredAuthors"] }>(
        `${apiUrl}/authors?limit=8&sortBy=featured`
      ),
    ]);

  return {
    topStories: topStories && topStories.length > 0 ? topStories : undefined,
    latestUpdatedData: latestUpdatedData?.items
      ? latestUpdatedData
      : undefined,
    newestStories:
      newestRes?.items && newestRes.items.length > 0
        ? newestRes.items
        : undefined,
    featuredAuthors:
      authorsRes?.items && authorsRes.items.length > 0
        ? authorsRes.items
        : undefined,
  };
}

export default async function HomePage() {
  const initialData = await getHomeInitialData();
  return <HomeView initialData={initialData} />;
}
