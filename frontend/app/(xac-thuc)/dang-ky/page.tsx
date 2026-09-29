"use client";

import { useRegister } from "@/lib/hooks/useRegister";
import {
  StepIndicator,
  AuthHeader,
  AuthAlert,
  RegisterForm,
  OtpVerificationForm,
  SocialAuthButtons,
  AuthFooterSwitcher,
} from "@/components/auth";

export default function RegisterPage() {
  const registerState = useRegister();
  const { step, email, backendMessage, backendError } = registerState;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 space-y-6">
      {/* 1. Step Indicator Header */}
      <StepIndicator currentStep={step} />

      {/* 2. Page Title & Description */}
      <AuthHeader
        title={step === "form" ? "Đăng Ký Tài Khoản" : "Xác Thực Email"}
        subtitle={
          step === "form"
            ? "Gia nhập cộng đồng độc giả StoryVN hoàn toàn miễn phí"
            : `Mã OTP đã được gửi đến email ${email}`
        }
      />

      {/* 3. Success / Error Feedback Alert */}
      <AuthAlert message={backendMessage} error={backendError} />

      {/* 4. Form (Step 1: Register Info | Step 2: OTP Verification) */}
      {step === "form" ? (
        <RegisterForm {...registerState} />
      ) : (
        <OtpVerificationForm {...registerState} />
      )}

      {/* 5. Social Login & Switcher (Step 1 only) */}
      {step === "form" && (
        <>
          <SocialAuthButtons />
          <AuthFooterSwitcher
            questionText="Đã có tài khoản?"
            actionText="Đăng nhập ngay"
            href="/dang-nhap"
          />
        </>
      )}
    </div>
  );
}
