import { UserCoinPackagesView } from "@/features/coin-packages/components/UserCoinPackagesView";

export const metadata = {
  title: "Nạp Xu Đọc Truyện VIP | StoryVN",
  description:
    "Bảng giá các gói nạp Xu ưu đãi tại StoryVN. Mở khóa chương truyện đặc sắc, ủng hộ tác giả yêu thích.",
};

export default function NapXuPage() {
  return <UserCoinPackagesView />;
}
