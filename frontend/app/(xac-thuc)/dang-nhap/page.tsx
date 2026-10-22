import type { Metadata } from "next";
import { LoginView } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng nhập | StoryVN",
  description: "Đăng nhập vào hệ thống đọc truyện StoryVN để theo dõi và lưu trữ truyện yêu thích.",
};

export default function LoginPage() {
  return <LoginView />;
}
