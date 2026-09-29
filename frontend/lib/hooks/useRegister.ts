"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";

export type RegisterStep = "form" | "otp";

export function useRegister() {
  const router = useRouter();

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Flow states
  const [step, setStep] = useState<RegisterStep>("form");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // UI / Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");
  const [backendError, setBackendError] = useState("");

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Submit registration details to receive OTP
  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBackendError("");
    setBackendMessage("");

    if (password !== confirmPassword) {
      setBackendError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (!termsAccepted) {
      setBackendError("Vui lòng đồng ý với điều khoản sử dụng!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.register({
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Show message from backend & switch to OTP step
      setBackendMessage(res.message);
      setStep("otp");
      setCountdown(60);
    } catch (err: any) {
      // Backend error message
      setBackendError(err?.message || "Đã có lỗi xảy ra khi đăng ký!");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBackendError("");
    setBackendMessage("");

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setBackendError("Mã OTP phải có đúng 6 chữ số!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyRegister({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      setBackendMessage(res.message);

      // Chuyển hướng sang trang đăng nhập và để yên đó
      const targetUrl = `/dang-nhap?registered=true&email=${encodeURIComponent(
        email.trim().toLowerCase()
      )}&message=${encodeURIComponent(res.message || "Đăng ký tài khoản thành công")}`;
      
      router.push(targetUrl);
    } catch (err: any) {
      // Backend error message
      setBackendError(err?.message || "Mã OTP không chính xác hoặc đã hết hạn!");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (countdown > 0 || isResending) return;

    setBackendError("");
    setBackendMessage("");
    setIsResending(true);

    try {
      const res = await authService.resendOtp({
        email: email.trim().toLowerCase(),
      });

      // Show message from backend
      setBackendMessage(res.message);
      setCountdown(60);
      setOtp("");
    } catch (err: any) {
      // Backend error message
      setBackendError(err?.message || "Không thể gửi lại mã OTP lúc này!");
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, email]);

  // Back to registration form to change details/email
  const handleBackToForm = () => {
    setStep("form");
    setBackendError("");
    setBackendMessage("");
    setOtp("");
  };

  return {
    // Form fields & setters
    displayName,
    setDisplayName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAccepted,
    setTermsAccepted,

    // Step & OTP
    step,
    otp,
    setOtp,
    countdown,
    canResend: countdown === 0,

    // Status
    isLoading,
    isResending,
    backendMessage,
    backendError,
    setBackendError,
    setBackendMessage,

    // Actions
    handleRegisterSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToForm,
  };
}
