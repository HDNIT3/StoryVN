import { AuthorSidebar } from "@/features/author";

export const metadata = {
  title: "Quản lý tác giả - StoryVN",
  description: "Không gian sáng tác, quản lý tác phẩm và thống kê của tác giả.",
};

export default function TacGiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] flex w-full">
      {/* Persistent Author Sidebar */}
      <AuthorSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
