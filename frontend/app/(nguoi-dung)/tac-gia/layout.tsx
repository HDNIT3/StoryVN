import { AuthorLayoutView } from "@/features/author";

export const metadata = {
  title: "Quản lý tác giả - StoryVN",
  description: "Không gian sáng tác, quản lý tác phẩm và thống kê của tác giả.",
};

export default function TacGiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthorLayoutView>{children}</AuthorLayoutView>;
}
