import api from "../api";

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface VerifyRegisterPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken?: string;
  allDevices?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const authService = {
  // Gửi thông tin đăng ký để nhận mã OTP qua email
  register(payload: RegisterPayload) {
    return api.post<AuthApiResponse>("/auth/register", payload);
  },

  // Xác thực mã OTP để hoàn tất đăng ký
  verifyRegister(payload: VerifyRegisterPayload) {
    return api.post<AuthApiResponse<{ user: any }>>("/auth/verify-register", payload);
  },

  // Gửi lại mã OTP đăng ký
  resendOtp(payload: ResendOtpPayload) {
    return api.post<AuthApiResponse>("/auth/resend-register-otp", payload);
  },

  // Đăng nhập bằng email và mật khẩu
  login(payload: LoginPayload) {
    return api.post<AuthApiResponse<LoginResponseData>>("/auth/login", payload);
  },

  // Lấy accessToken mới bằng refreshToken
  refreshToken(payload: RefreshTokenPayload) {
    return api.post<AuthApiResponse<RefreshTokenResponseData>>("/auth/refresh", payload);
  },

  // Đăng xuất tài khoản (hỗ trợ logout toàn thiết bị hoặc thiết bị hiện tại)
  logout(payload?: LogoutPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/logout", payload);
  },

  // Yêu cầu khôi phục mật khẩu (gửi OTP qua email)
  forgotPassword(payload: ForgotPasswordPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/forgot-password", payload);
  },

  // Đặt lại mật khẩu mới với mã OTP
  resetPassword(payload: ResetPasswordPayload) {
    return api.post<AuthApiResponse<Record<string, never>>>("/auth/reset-password", payload);
  },
};

export default authService;
