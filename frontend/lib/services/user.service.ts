import api from "../api";
import type { UserApiResponse, UserProfileData } from "../../types/user";

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  coverUrl?: string;
  avatarUrl?: string;
}

export interface UpdateAvatarPayload {
  avatarUrl: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  /**
   * Lấy thông tin hồ sơ cá nhân của người dùng hiện tại (yêu cầu Bearer Token)
   */
  getProfile() {
    return api.get<UserApiResponse<UserProfileData>>("/users/profile");
  },

  /**
   * Cập nhật thông tin hồ sơ (displayName, bio, coverUrl, avatarUrl)
   */
  updateProfile(payload: UpdateProfilePayload) {
    return api.patch<UserApiResponse<UserProfileData>>("/users/profile", payload);
  },

  /**
   * Cập nhật ảnh đại diện qua URL
   */
  updateAvatar(payload: UpdateAvatarPayload) {
    return api.patch<UserApiResponse<{ avatarUrl: string }>>("/users/avatar", payload);
  },

  /**
   * Cập nhật ảnh bìa qua URL
   */
  updateCover(coverUrl: string) {
    return api.patch<UserApiResponse<{ coverUrl: string }>>("/users/cover", { coverUrl });
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  changePassword(payload: ChangePasswordPayload) {
    return api.put<UserApiResponse<Record<string, never>>>("/users/change-password", payload);
  },
};

export default userService;
