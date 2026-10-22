import { use } from "react";
import { ChapterReaderView } from "@/features/chapters";

export default function ChapterReadingPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const { slug, chapterNumber } = use(paramsPromise);

  return <ChapterReaderView slug={slug} chapterNumber={chapterNumber} />;
}
