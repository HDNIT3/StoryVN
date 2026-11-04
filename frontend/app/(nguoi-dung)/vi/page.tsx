import type { Metadata } from "next";
import { WalletView } from "@/features/wallet";

export const metadata: Metadata = {
  title: "Ví của tôi - StoryVN",
  description:
    "Xem số dư Xu, tổng Xu đã dùng và các giao dịch nạp Xu gần đây trong ví StoryVN của bạn",
};

export default function ViPage() {
  return <WalletView />;
}
