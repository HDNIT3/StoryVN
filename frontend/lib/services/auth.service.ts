import api from "../api";
import type {
  RegisterPayload,
  VerifyRegisterPayload,
  ResendOtpPayload,
  LoginPayload,
  LoginResponseData,
  RefreshTokenPayload,
  RefreshTokenResponseData,
  LogoutPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthApiResponse,
} from "../../types/auth";

export const authService = {
  /**
   * Gửi thông tin đăng ký tài khoản mới để nhận mã xác thực OTP qua email
   */
  register(payload: RegisterPayload) {
    return api.post<AuthApiResponse>("/auth/register", payload);
  },

  /**
   * Xác thực mã OTP để kích hoạt tài khoản sau khi đăng ký
   */
  verifyRegister(payload: VerifyRegisterPayload) {
    return api.post<AuthApiResponse<{ user: any }>>("/auth/verify-register", payload);
  },

  /**
   * Gửi lại mã OTP xác thực đăng ký tài khoản
   */
  resendOtp(payload: ResendOtpPayload) {
    return api.post<AuthApiResponse>("/auth/resend-register-otp", payload);
  },

  /**
   * Đăng nhập hệ thống bằng email và mật khẩu
   */
  login(payload: LoginPayload) {
    return api.post<AuthApiResponse<LoginResponseData>>("/auth/login", payload);
  },

  /**
   * Cấp lại access token mới thông qua refresh token hợp lệ
   */
  refreshToken(payload: RefreshTokenPayload) {
    return api.post<AuthApiResponse<RefreshTokenResponseData>>("/auth/refresh", payload);
  },

  /**
   * Đăng xuất tài khoản (hỗ trợ đăng xuất thiết bị hiện tại hoặc tất cả các thiết bị)
   */
  logout(payload?: LogoutPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/logout", payload);
  },

  /**
   * Yêu cầu khôi phục mật khẩu quên (hệ thống gửi OTP về email)
   */
  forgotPassword(payload: ForgotPasswordPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/forgot-password", payload);
  },

  /**
   * Đặt lại mật khẩu mới kèm mã xác thực OTP
   */
  resetPassword(payload: ResetPasswordPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/reset-password", payload);
  },
};

export default authService;
