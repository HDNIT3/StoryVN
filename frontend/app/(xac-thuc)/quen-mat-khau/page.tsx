"use client";

import React, { useState, useCallback } from "react";
import { AuthHeader, AuthAlert, AuthFooterSwitcher } from "@/components/auth";
import { Input, Button } from "@/components/ui";
import { authService } from "@/lib/services/auth.service";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

type Step = "email" | "otp" | "newpass";

function getErrorMessage(err: any, fallback: string): string {
  const msg = err?.message;
  if (!msg || msg.includes("Failed to fetch")) return "Website chưa hoạt động vui lòng chờ";
  return msg || fallback;
}

export default function QuenMatKhauPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
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

  // ─── Step 1: Gửi email ────────────────────────────────
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
      } catch (err: any) {
        const msg = getErrorMessage(err, "Gửi yêu cầu thất bại, vui lòng thử lại");
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  // ─── Resend OTP ───────────────────────────────────────
  const handleResendOtp = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword({ email: email.trim().toLowerCase() });
      if (!res.success) throw new Error(res.message);
      toast.success("Đã gửi lại mã OTP!");
    } catch (err: any) {
      const msg = getErrorMessage(err, "Gửi lại OTP thất bại");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // ─── Step 2: Xác nhận OTP → chuyển sang bước 3 ───────
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

  // ─── Step 3: Đặt mật khẩu mới ─────────────────────────
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
        router.push(`/dang-nhap?registered=true&message=Đặt lại mật khẩu thành công! Vui lòng đăng nhập.&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } catch (err: any) {
        const msg = getErrorMessage(err, "Đặt lại mật khẩu thất bại");
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email, otp, newPassword, confirmPassword, router]
  );

  const eyeIcon = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="hover:text-zinc-600 focus:outline-none cursor-pointer"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {(["email", "otp", "newpass"] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-sky-500 text-white"
                  : ["email", "otp", "newpass"].indexOf(step) > i
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {["email", "otp", "newpass"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 transition-colors ${
                  ["email", "otp", "newpass"].indexOf(step) > i ? "bg-emerald-400" : "bg-zinc-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Header */}
      <AuthHeader
        title={
          step === "email"
            ? "Quên Mật Khẩu"
            : step === "otp"
            ? "Nhập Mã OTP"
            : "Đặt Mật Khẩu Mới"
        }
        subtitle={
          step === "email"
            ? "Nhập email để nhận mã xác thực khôi phục mật khẩu"
            : step === "otp"
            ? `Nhập mã 6 số đã gửi đến ${email}`
            : "Tạo mật khẩu mới cho tài khoản của bạn"
        }
      />

      <AuthAlert error={error} />

      {/* ─── Step 1: Email ─── */}
      {step === "email" && (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input
            id="forgot-email"
            label="Email"
            placeholder="example@gmail.com"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          <Button id="btn-forgot-send-email" type="submit" fullWidth size="lg" isLoading={isLoading}>
            Gửi Mã Xác Thực
          </Button>
        </form>
      )}

      {/* ─── Step 2: OTP ─── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input
            id="forgot-otp"
            label="Mã OTP"
            placeholder="123456"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <Button id="btn-forgot-verify-otp" type="submit" fullWidth size="lg" isLoading={isLoading}>
            Xác Nhận Mã OTP
          </Button>
          <div className="text-center text-xs text-zinc-500">
            Không nhận được mã?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-sky-600 hover:text-sky-700 font-medium cursor-pointer disabled:opacity-60"
            >
              Gửi lại
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 3: New Password ─── */}
      {step === "newpass" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            id="forgot-new-password"
            label="Mật khẩu mới"
            placeholder="••••••••"
            type={showNewPass ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            rightIcon={eyeIcon(showNewPass, () => setShowNewPass(!showNewPass))}
          />
          <Input
            id="forgot-confirm-password"
            label="Xác nhận mật khẩu mới"
            placeholder="••••••••"
            type={showConfirmPass ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            rightIcon={eyeIcon(showConfirmPass, () => setShowConfirmPass(!showConfirmPass))}
          />
          <Button id="btn-forgot-reset-password" type="submit" fullWidth size="lg" isLoading={isLoading}>
            Đặt Lại Mật Khẩu
          </Button>
        </form>
      )}

      <AuthFooterSwitcher
        questionText="Nhớ mật khẩu rồi?"
        actionText="Đăng nhập"
        href="/dang-nhap"
      />
    </div>
  );
}
