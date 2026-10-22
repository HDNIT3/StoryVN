"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { toast } from "@/lib/toast";
import type { ForgotPasswordStep } from "../types";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message.includes("Failed to fetch")) return "Website chưa hoạt động vui lòng chờ";
    return err.message || fallback;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.includes("Failed to fetch")) return "Website chưa hoạt động vui lòng chờ";
    return msg || fallback;
  }
  return fallback;
}

export function useForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: email
  const [email, setEmail] = useState("");

  // Step 2: OTP
  const [otp, setOtp] = useState("");

  // Step 3: new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Step 1: Send email
  const handleSendEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      const emailTrimmed = email.trim().toLowerCase();
      if (!emailTrimmed) {
        setError("Vui lòng nhập email");
        return;
      }
      setIsLoading(true);
      try {
        const res = await authService.forgotPassword({ email: emailTrimmed });
        if (!res.success) throw new Error(res.message);
        toast.success("Đã gửi mã OTP về email của bạn!");
        setStep("otp");
      } catch (err: unknown) {
        const msg = getErrorMessage(err, "Gửi yêu cầu thất bại, vui lòng thử lại");
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword({ email: email.trim().toLowerCase() });
      if (!res.success) throw new Error(res.message);
      toast.success("Đã gửi lại mã OTP!");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Gửi lại OTP thất bại");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // Step 2: Verify OTP
  const handleVerifyOtp = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (otp.trim().length !== 6) {
        setError("Mã OTP phải gồm 6 chữ số");
        return;
      }
      setStep("newpass");
    },
    [otp]
  );

  // Step 3: Reset password
  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (newPassword.length < 6) {
        setError("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Xác nhận mật khẩu không khớp");
        return;
      }
      setIsLoading(true);
      try {
        const res = await authService.resetPassword({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        });
        if (!res.success) throw new Error(res.message);
        toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        router.push(
          `/dang-nhap?registered=true&message=Đặt lại mật khẩu thành công! Vui lòng đăng nhập.&email=${encodeURIComponent(
            email.trim().toLowerCase()
          )}`
        );
      } catch (err: unknown) {
        const msg = getErrorMessage(err, "Đặt lại mật khẩu thất bại");
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email, otp, newPassword, confirmPassword, router]
  );

  return {
    step,
    setStep,
    isLoading,
    error,
    setError,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPass,
    setShowNewPass,
    showConfirmPass,
    setShowConfirmPass,
    handleSendEmail,
    handleResendOtp,
    handleVerifyOtp,
    handleResetPassword,
  };
}
