"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { UserProfile } from "../types";
import type { AuthorProfileItem, AuthorRequestItem } from "@/features/author";

interface ProfileRolePanelsProps {
  user: UserProfile;
  authorProfile?: AuthorProfileItem | null;
  authorRequest?: AuthorRequestItem | null;
}

export function ProfileRolePanels({
  user,
  authorProfile,
  authorRequest,
}: ProfileRolePanelsProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Không gian tác giả (dành cho Role AUTHOR) */}
      {user.role === "AUTHOR" && authorProfile && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-xs p-5 sm:p-6">
          <h2 className="text-base font-bold text-sky-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Không gian tác giả
          </h2>

          <div className="space-y-4">
            <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
              <p className="text-xs text-zinc-500 font-medium">Bút danh chính thức</p>
              <p className="font-bold text-zinc-900 text-xl mt-0.5">{authorProfile.penName}</p>
              {authorProfile.biography && (
                <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{authorProfile.biography}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="text-center p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xl sm:text-2xl font-bold text-sky-600">{authorProfile.storyCount || 0}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Tác phẩm</p>
              </div>
              <div className="text-center p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xl sm:text-2xl font-bold text-sky-600">{authorProfile.followerCount || 0}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Theo dõi</p>
              </div>
              <div className="text-center p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xl sm:text-2xl font-bold text-sky-600">{authorProfile.totalViews || 0}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Lượt xem</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-sky-100 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Quản lý và xuất bản các tác phẩm truyện</p>
            <Button
              id="btn-quan-ly-tac-pham"
              variant="primary"
              size="sm"
              onClick={() => router.push("/tac-gia/tong-quan")}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            >
              Quản lý tác giả
            </Button>
          </div>
        </div>
      )}

      {/* Đăng ký tác giả (dành cho Role USER) */}
      {user.role === "USER" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 sm:p-6">
          <h2 className="text-base font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Trở thành Tác giả trên StoryVN
          </h2>

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
                  className={`w-2.5 h-2.5 rounded-full ${
                    authorRequest.status === "PENDING"
                      ? "bg-yellow-500"
                      : authorRequest.status === "APPROVED"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    authorRequest.status === "PENDING"
                      ? "text-yellow-700"
                      : authorRequest.status === "APPROVED"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {authorRequest.status === "PENDING"
                    ? "Đang chờ xét duyệt hồ sơ"
                    : authorRequest.status === "APPROVED"
                    ? "Đã được phê duyệt"
                    : "Yêu cầu bị từ chối"}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Bút danh đăng ký: <strong>{authorRequest.penName}</strong>
              </p>
              {authorRequest.adminNote && (
                <p className="text-xs text-zinc-500 mt-1.5 italic bg-white/60 p-2 rounded-lg border border-zinc-200/60">
                  Ghi chú từ quản trị viên: &ldquo;{authorRequest.adminNote}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="bg-sky-50/60 rounded-xl p-4 border border-sky-100 mb-4">
              <p className="text-sm text-zinc-700 leading-relaxed">
                Đăng ký trở thành tác giả để bắt đầu chia sẻ câu chuyện, tiếp cận cộng đồng hàng chục ngàn độc giả và nhận các đặc quyền sáng tác trên StoryVN.
              </p>
            </div>
          )}

          <Button
            id="btn-go-author-register"
            variant={authorRequest?.status === "PENDING" ? "secondary" : "primary"}
            size="sm"
            onClick={() => router.push("/tac-gia/dang-ky")}
          >
            {!authorRequest
              ? "📝 Đăng ký làm tác giả ngay"
              : authorRequest.status === "PENDING"
              ? "👁️ Xem chi tiết đơn đăng ký"
              : authorRequest.status === "REJECTED"
              ? "✏️ Chỉnh sửa và gửi lại"
              : "Xem hồ sơ tác giả"}
          </Button>
        </div>
      )}

      {/* Quản trị hệ thống (dành cho Role ADMIN hoặc MANAGER) */}
      {(user.role === "ADMIN" || user.role === "MANAGER") && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-xs p-5 sm:p-6">
          <h2 className="text-base font-bold text-sky-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {user.role === "ADMIN" ? "Quản trị hệ thống toàn diện" : "Bảng quản lý nội dung"}
          </h2>
          <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
            Truy cập trung tâm điều hành quản lý người dùng, duyệt yêu cầu tác giả, phân loại thể loại và thẻ tag hệ thống.
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
    </div>
  );
}
