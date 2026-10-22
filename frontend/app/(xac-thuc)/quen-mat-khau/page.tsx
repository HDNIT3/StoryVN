import type { Metadata } from "next";
import { ForgotPasswordView } from "@/features/auth";

export const metadata: Metadata = {
  title: "Quên mật khẩu | StoryVN",
  description: "Khôi phục mật khẩu tài khoản StoryVN nhanh chóng qua mã xác thực OTP.",
};

export default function QuenMatKhauPage() {
  return <ForgotPasswordView />;
}
