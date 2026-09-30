import type { UserRole } from "./user";

/** Vai trò người dùng */
export type Role = UserRole;

/** Thông tin cơ bản người dùng sau khi đăng nhập */
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  coins?: number;
  createdAt?: string;
}

/** Dữ liệu form đăng nhập */
export interface LoginDto {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

/** Dữ liệu form đăng ký */
export interface RegisterDto {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
}

/** Dữ liệu gửi lên API khi đăng ký tài khoản */
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

/** Dữ liệu gửi lên API khi xác thực mã OTP đăng ký */
export interface VerifyRegisterPayload {
  email: string;
  otp: string;
}

/** Dữ liệu gửi lên API khi yêu cầu gửi lại OTP */
export interface ResendOtpPayload {
  email: string;
}

/** Dữ liệu gửi lên API khi đăng nhập */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Dữ liệu token trả về khi đăng nhập thành công */
export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
}

/** Dữ liệu gửi lên API khi làm mới token */
export interface RefreshTokenPayload {
  refreshToken: string;
}

/** Dữ liệu token mới trả về sau khi refresh */
export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

/** Dữ liệu gửi lên API khi đăng xuất */
export interface LogoutPayload {
  refreshToken?: string;
  allDevices?: boolean;
}

/** Dữ liệu gửi lên API khi quên mật khẩu */
export interface ForgotPasswordPayload {
  email: string;
}

/** Dữ liệu gửi lên API khi đặt lại mật khẩu bằng OTP */
export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/** Cấu trúc chuẩn phản hồi từ API Auth */
export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/** Kết quả đăng nhập chứa token và thông tin người dùng */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

/** Trạng thái lưu trữ của Auth Context / State */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
