import type { Metadata } from "next";
import { RegisterView } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản | StoryVN",
  description: "Gia nhập cộng đồng độc giả StoryVN hoàn toàn miễn phí.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
