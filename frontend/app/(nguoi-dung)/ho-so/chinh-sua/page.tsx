import type { Metadata } from "next";
import { EditProfileView } from "@/features/user";

export const metadata: Metadata = {
  title: "Chỉnh sửa hồ sơ - StoryVN",
  description: "Cập nhật ảnh đại diện, tên hiển thị, mật khẩu và hồ sơ tác giả trên StoryVN",
};

export default function ChinhSuaHoSoPage() {
  return <EditProfileView />;
}
