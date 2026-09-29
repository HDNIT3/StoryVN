export type Role = "USER" | "AUTHOR" | "MANAGER" | "ADMIN";

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

export interface LoginDto {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
}

export type {
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
} from "../lib/services/auth.service";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
