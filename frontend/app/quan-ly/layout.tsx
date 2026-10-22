import { AdminLayoutView } from "@/features/admin";

export default function QuanLyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutView>{children}</AdminLayoutView>;
}
