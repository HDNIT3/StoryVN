import type { Metadata } from "next";
import { AdminWithdrawalsView } from "@/features/admin/components/withdrawals/AdminWithdrawalsView";

export const metadata: Metadata = { title: "Yêu cầu rút nhuận bút | StoryVN" };
export default function WithdrawalsPage() {
  return <AdminWithdrawalsView />;
}
