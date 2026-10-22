"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useUserAuthorStatus } from "../queries/useUserQueries";
import { EditProfileModal } from "./EditProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { ProfileUserCard } from "./ProfileUserCard";
import { ProfileRolePanels } from "./ProfileRolePanels";

export function ProfileView() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: authorData } = useUserAuthorStatus(
    !!user && (user.role === "USER" || user.role === "AUTHOR")
  );

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const authorRequest = authorData?.request;
  const authorProfile = authorData?.authorProfile;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {showEditProfile && (
        <EditProfileModal
          initialName={user.displayName}
          initialAvatarUrl={user.avatarUrl}
          onClose={() => setShowEditProfile(false)}
          onSaved={async () => {
            await refreshUser();
            setShowEditProfile(false);
          }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Thông tin tài khoản chính */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <ProfileUserCard
            user={user}
            onEditProfile={() => setShowEditProfile(true)}
            onChangePassword={() => setShowChangePassword(true)}
            onLogout={handleLogout}
            onRefreshUser={refreshUser}
          />
        </div>

        {/* Cột phải: Thông tin mở rộng & Quyền tác giả / Quản lý */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ProfileRolePanels
            user={user}
            authorProfile={authorProfile}
            authorRequest={authorRequest}
          />
        </div>
      </div>
    </div>
  );
}
