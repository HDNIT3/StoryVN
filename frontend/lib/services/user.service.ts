import api from "../api";
import type { UserApiResponse, UserProfileData } from "../../types/user";

export const userService = {
  /**
   * Lấy thông tin hồ sơ cá nhân của người dùng hiện tại (yêu cầu Bearer Token)
   */
  getProfile() {
    return api.get<UserApiResponse<UserProfileData>>("/users/profile");
  },
};

export default userService;
