import api from "../api";

export type UserRole = "USER" | "AUTHOR" | "MANAGER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface UserProfile {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileData {
  user: UserProfile;
}

export interface UserApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export const userService = {
  // Lấy thông tin hồ sơ cá nhân của người dùng đang đăng nhập (cần Bearer token)
  getProfile() {
    return api.get<UserApiResponse<UserProfileData>>("/users/profile");
  },
};

export default userService;
