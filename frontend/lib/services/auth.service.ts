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

export const authService = {
  // Gửi thông tin đăng ký để nhận mã OTP qua email
  register(payload: RegisterPayload) {
    return api.post("/auth/register", payload);
  },

  // Xác thực mã OTP để hoàn tất đăng ký
  verifyRegister(payload: VerifyRegisterPayload) {
    return api.post("/auth/verify-register", payload);
  },

  // Gửi lại mã OTP
  resendOtp(payload: ResendOtpPayload) {
    return api.post("/auth/resend-register-otp", payload);
  },
};

export default authService;
