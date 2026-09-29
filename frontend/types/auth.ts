export type Role = "USER" | "ADMIN";

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
