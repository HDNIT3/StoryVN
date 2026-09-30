/** Vai trò người dùng trong hệ thống */
export type UserRole = "USER" | "AUTHOR" | "MANAGER" | "ADMIN";

/** Trạng thái tài khoản người dùng */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

/** Thông tin hồ sơ người dùng */
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

/** Dữ liệu trả về khi lấy hồ sơ người dùng */
export interface UserProfileData {
  user: UserProfile;
}

/** Cấu trúc chuẩn phản hồi từ API User */
export interface UserApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}
