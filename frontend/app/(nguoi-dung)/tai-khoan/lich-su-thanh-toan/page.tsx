import type { Metadata } from "next";
import { PaymentHistoryView } from "@/features/payments";

export const metadata: Metadata = {
  title: "Lịch sử thanh toán - StoryVN",
  description:
    "Theo dõi các đơn nạp Xu qua VNPay, trạng thái xử lý và số Xu được cộng vào ví StoryVN",
};

export default function LichSuThanhToanPage() {
  return <PaymentHistoryView />;
}
