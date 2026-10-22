import type { Metadata } from "next";
import { ProfileView } from "@/features/user";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân - StoryVN",
  description: "Quản lý thông tin tài khoản, đổi mật khẩu và cập nhật hồ sơ trên StoryVN",
};

export default function HoSoPage() {
  return <ProfileView />;
}
