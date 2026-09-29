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

  // Gửi lại mã OTP
  resendOtp(payload: ResendOtpPayload) {
    return api.post<AuthApiResponse>("/auth/resend-register-otp", payload);
  },
};

export default authService;
