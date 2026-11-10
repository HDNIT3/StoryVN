"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRegister } from "../hooks/useRegister";
import {
  AuthBrandPanel,
  StepIndicator,
  AuthHeader,
  AuthAlert,
  SocialAuthButtons,
  AuthFooterSwitcher,
} from "./shared";
import { RegisterForm } from "./forms/RegisterForm";
import { OtpVerificationForm } from "./forms/OtpVerificationForm";

export function RegisterView() {
  const registerState = useRegister();
  const { step, email, backendMessage, backendError } = registerState;

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* 1. Left Column: Brand Celestial Showcase (Hidden on Mobile, 44-45% on Desktop) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[44%] h-full max-h-screen shrink-0 overflow-hidden">
        <AuthBrandPanel
          title={
            step === "form"
              ? "Bắt đầu hành trình cùng StoryVN"
              : "Bảo vệ tài khoản độc giả của bạn"
          }
          subtitle={
            step === "form"
              ? "Khám phá và lưu trữ các tác phẩm bạn yêu thích."
              : "Xác thực email để bảo vệ tủ truyện và tiến trình đọc của bạn."
          }
        />
      </div>

      {/* 2. Right Column: Authentication Form Container (55-56% on Desktop) */}
      <div className="w-full lg:w-[55%] xl:w-[56%] h-full max-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto bg-white">
        {/* Top Navigation: Về trang chủ + Mobile Logo */}
        <div className="w-full max-w-xl mx-auto flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-sky-600 transition-colors duration-150 group px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Về trang chủ</span>
          </Link>

          {/* Mobile Logo with Official StoryVN Icon */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-zinc-200 shadow-2xs">
              <Image
                src="/icon/iconweb.png"
                alt="StoryVN Icon"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-base text-zinc-900 tracking-tight">
              Story<span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent ml-0.5">VN</span>
            </span>
          </Link>
        </div>

        {/* Form Center Box */}
        <div className="w-full max-w-xl mx-auto my-auto space-y-6">
          {/* Step Progress Indicator */}
          <StepIndicator currentStep={step} />

          {/* Page Title & Description (Step 1 only - Step 2 has its own centered title) */}
          {step === "form" && (
            <AuthHeader
              title="Đăng Ký Tài Khoản"
              subtitle="Gia nhập cộng đồng độc giả StoryVN hoàn toàn miễn phí"
              align="center"
            />
          )}

          {/* Alert Banner */}
          <AuthAlert message={backendMessage} error={backendError} />

          {/* Step 1: Info Form | Step 2: OTP Form */}
          {step === "form" ? (
            <>
              <RegisterForm {...registerState} />
              <SocialAuthButtons />
              <AuthFooterSwitcher
                questionText="Đã có tài khoản?"
                actionText="Đăng nhập ngay"
                href="/dang-nhap"
              />
            </>
          ) : (
            <OtpVerificationForm {...registerState} />
          )}
        </div>

        {/* Bottom spacer for clean balance */}
        <div className="w-full h-4" />
      </div>
    </div>
  );
}

export default RegisterView;
