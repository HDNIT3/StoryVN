import type { Metadata } from 'next';
import { RankingsPageView } from '@/features/rankings';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng truyện và tác giả | StoryVN',
  description: 'Khám phá truyện và tác giả nổi bật trên StoryVN theo lượt đọc, theo dõi, đánh giá và mua chương.',
};

export default function RankingsPage() {
  return <RankingsPageView />;
}
