"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  authorRequestService,
  AuthorRequestStatusData,
} from "@/lib/services/author-request.service";

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const ROLE_BG: Record<string, string> = {
  USER: "from-zinc-400 to-zinc-600",
  AUTHOR: "from-orange-400 to-rose-500",
  MANAGER: "from-blue-400 to-indigo-600",
  ADMIN: "from-purple-500 to-purple-700",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm đình chỉ",
  BANNED: "Bị cấm",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-yellow-100 text-yellow-700",
  BANNED: "bg-red-100 text-red-700",
};

export default function HoSoPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [authorData, setAuthorData] = useState<AuthorRequestStatusData | null>(null);

  // Fetch trạng thái author request (nếu là USER hoặc AUTHOR)
  useEffect(() => {
    if (user?.role === "USER" || user?.role === "AUTHOR") {
      authorRequestService
        .getAuthorProfileAndRequestStatus()
        .then((res) => setAuthorData(res.data))
        .catch(() => setAuthorData(null));
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const avatarInitial = (user.displayName || user.username || "U")
    .charAt(0)
    .toUpperCase();

  const coverGradient = ROLE_BG[user.role] || ROLE_BG.USER;

  // Trạng thái yêu cầu tác giả cho USER
  const authorRequest = authorData?.request;
  const authorProfile = authorData?.authorProfile;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ─── Profile Card ─── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
        {/* Cover */}
        <div className={`h-28 bg-gradient-to-br ${coverGradient}`} />

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-orange-500 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">{avatarInitial}</span>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  STATUS_COLOR[user.status] || "bg-zinc-100 text-zinc-700"
                }`}
              >
                {STATUS_LABEL[user.status] || user.status}
              </span>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-2xl font-bold text-zinc-900">{user.displayName}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">@{user.username}</p>
          <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400">
            {user.createdAt && (
              <span>
                Tham gia:{" "}
                <span className="text-zinc-600 font-medium">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── AUTHOR: Thông tin tác giả ─── */}
      {user.role === "AUTHOR" && authorProfile && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-orange-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Trang tác giả
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500">Bút danh</p>
              <p className="font-bold text-zinc-900 text-lg">{authorProfile.penName}</p>
            </div>
            {authorProfile.biography && (
              <div>
                <p className="text-xs text-zinc-500">Tiểu sử</p>
                <p className="text-sm text-zinc-700">{authorProfile.biography}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-xl font-bold text-orange-600">{authorProfile.storyCount || 0}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Tác phẩm</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-xl font-bold text-orange-600">{authorProfile.followerCount || 0}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Theo dõi</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-xl font-bold text-orange-600">{authorProfile.totalViews || 0}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Lượt xem</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-orange-100">
            <Button
              id="btn-quan-ly-tac-pham"
              variant="primary"
              size="sm"
              onClick={() => router.push("/tac-gia/tac-pham")}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            >
              Quản lý tác phẩm
            </Button>
          </div>
        </div>
      )}

      {/* ─── USER: Nâng cấp tác giả ─── */}
      {user.role === "USER" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Trở thành Tác giả
          </h2>

          {/* Hiển thị trạng thái yêu cầu */}
          {authorRequest ? (
            <div
              className={`rounded-xl p-4 mb-4 border ${
                authorRequest.status === "PENDING"
                  ? "bg-yellow-50 border-yellow-200"
                  : authorRequest.status === "APPROVED"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    authorRequest.status === "PENDING"
                      ? "bg-yellow-500"
                      : authorRequest.status === "APPROVED"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    authorRequest.status === "PENDING"
                      ? "text-yellow-700"
                      : authorRequest.status === "APPROVED"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {authorRequest.status === "PENDING"
                    ? "Đang chờ xét duyệt"
                    : authorRequest.status === "APPROVED"
                    ? "Đã được duyệt"
                    : "Bị từ chối"}
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                Bút danh: <strong>{authorRequest.penName}</strong>
              </p>
              {authorRequest.adminNote && (
                <p className="text-xs text-zinc-500 mt-1 italic">"{authorRequest.adminNote}"</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 mb-4">
              Đăng ký trở thành tác giả để bắt đầu chia sẻ tác phẩm với cộng đồng đọc giả StoryVN.
            </p>
          )}

          <Button
            id="btn-go-author-register"
            variant={authorRequest?.status === "PENDING" ? "secondary" : "outline"}
            size="sm"
            onClick={() => router.push("/tac-gia/dang-ky")}
          >
            {!authorRequest
              ? "📝 Đăng ký ngay"
              : authorRequest.status === "PENDING"
              ? "👁️ Xem trạng thái yêu cầu"
              : authorRequest.status === "REJECTED"
              ? "✏️ Chỉnh sửa và gửi lại"
              : "Xem hồ sơ tác giả"}
          </Button>
        </div>
      )}

      {/* ─── ADMIN / MANAGER ─── */}
      {(user.role === "ADMIN" || user.role === "MANAGER") && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {user.role === "ADMIN" ? "Quản trị hệ thống" : "Bảng quản lý"}
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Truy cập bảng điều khiển để quản lý hệ thống, duyệt yêu cầu tác giả và nội dung.
          </p>
          <Button
            id="btn-go-admin-panel"
            variant="primary"
            size="sm"
            onClick={() => router.push("/quan-ly/duyet-tac-gia")}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            }
          >
            Vào bảng quản lý
          </Button>
        </div>
      )}

      {/* ─── Đăng xuất ─── */}
      <div className="pt-2">
        <Button
          id="btn-logout"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
