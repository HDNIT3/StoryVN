import { ChapterReaderView } from "@/features/chapters";

async function getInitialChapter(slug: string, chapterNumber: string) {
  try {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    ).replace(/\/$/, "");
    const res = await fetch(
      `${apiUrl}/chapters/story/${encodeURIComponent(slug)}/chapter/${encodeURIComponent(chapterNumber)}`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2500),
      }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data;
  } catch {
    return undefined;
  }
}

export default async function ChapterReadingPage({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const { slug, chapterNumber } = await params;
  const initialChapter = await getInitialChapter(slug, chapterNumber);

  return (
    <ChapterReaderView
      slug={slug}
      chapterNumber={chapterNumber}
      initialChapter={initialChapter}
    />
  );
}
