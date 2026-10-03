"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  useMyAuthorStatus,
  useCreateAuthorRequest,
  useUpdateAuthorRequest,
} from "@/lib/hooks/queries/useAuthorRequestQuery";
import type {
  CreateAuthorRequestPayload,
  AuthorRequestStatusData,
  AuthorRequestStatus,
} from "@/types/author";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";



// ─── Status component ────────────────────────────────────────────
function RequestStatusCard({
  data,
  onEdit,
}: {
  data: AuthorRequestStatusData;
  onEdit: () => void;
}) {
  const { request, authorProfile, isAuthor, canEdit, isProcessed } = data;

  if (isAuthor && authorProfile) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-emerald-800 text-lg">Bạn đã là Tác giả!</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Bút danh: <strong>{authorProfile.penName}</strong>
            </p>
            {authorProfile.biography && (
              <p className="text-sm text-emerald-600 mt-1">{authorProfile.biography}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-700">
              <span>📖 {authorProfile.storyCount || 0} tác phẩm</span>
              <span>👥 {authorProfile.followerCount || 0} người theo dõi</span>
              <span>👁️ {authorProfile.totalViews || 0} lượt xem</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const statusConfig: Record<
    AuthorRequestStatus,
    {
      bg: string;
      border: string;
      iconBg: string;
      title: string;
      titleColor: string;
      desc: string;
      descColor: string;
    }
  > = {
    PENDING: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconBg: "bg-yellow-400",
      title: "Đang chờ xét duyệt",
      titleColor: "text-yellow-800",
      desc: "Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ phản hồi sớm nhất có thể.",
      descColor: "text-yellow-700",
    },
    APPROVED: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-500",
      title: "Yêu cầu đã được duyệt",
      titleColor: "text-emerald-800",
      desc: "Chúc mừng! Tài khoản của bạn đã được nâng cấp thành Tác giả.",
      descColor: "text-emerald-700",
    },
    REJECTED: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-500",
      title: "Yêu cầu bị từ chối",
      titleColor: "text-red-800",
      desc: "Yêu cầu của bạn chưa được chấp nhận lần này. Bạn có thể chỉnh sửa và gửi lại.",
      descColor: "text-red-700",
    },
  };

  const cfg = statusConfig[request.status];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6 space-y-3`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${cfg.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {request.status === "PENDING" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : request.status === "APPROVED" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${cfg.titleColor}`}>{cfg.title}</h3>
          <p className={`text-sm mt-0.5 ${cfg.descColor}`}>{cfg.desc}</p>
          {request.adminNote && (
            <div className="mt-2 p-2.5 bg-white/60 rounded-xl border border-current/10">
              <p className="text-xs font-medium text-zinc-600">Ghi chú từ quản trị viên:</p>
              <p className={`text-sm mt-0.5 ${cfg.descColor}`}>{request.adminNote}</p>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
            <span>Bút danh: <strong>{request.penName}</strong></span>
            {request.createdAt && (
              <span>Ngày gửi: {new Date(request.createdAt).toLocaleDateString("vi-VN")}</span>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="pt-2 border-t border-current/10">
          <Button id="btn-edit-request" variant="outline" size="sm" onClick={onEdit}>
            ✏️ Chỉnh sửa yêu cầu
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Form ────────────────────────────────────────────────────────
interface AuthorFormProps {
  initialData?: CreateAuthorRequestPayload;
  onSubmit: (payload: CreateAuthorRequestPayload) => Promise<void>;
  isLoading: boolean;
  isEditing?: boolean;
}

function AuthorRequestForm({ initialData, onSubmit, isLoading, isEditing }: AuthorFormProps) {
  const [penName, setPenName] = useState(initialData?.penName || "");
  const [biography, setBiography] = useState(initialData?.biography || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [bankName, setBankName] = useState(initialData?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initialData?.bankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(initialData?.bankAccountName || "");
  const [reason, setReason] = useState(initialData?.reason || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penName.trim()) {
      toast.warning("Vui lòng nhập bút danh");
      return;
    }
    await onSubmit({
      penName: penName.trim(),
      biography: biography.trim() || undefined,
      website: website.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankAccountName: bankAccountName.trim() || undefined,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
          Thông tin tác giả
        </h3>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Bút danh <span className="text-red-500">*</span>
          </label>
          <input
            id="input-pen-name"
            type="text"
            value={penName}
            onChange={(e) => setPenName(e.target.value)}
            placeholder="Tên bút danh của bạn (ít nhất 2 ký tự)"
            required
            minLength={2}
            className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Tiểu sử / Giới thiệu</label>
          <textarea
            id="input-biography"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Giới thiệu về bản thân bạn, phong cách viết, thể loại yêu thích..."
            rows={4}
            className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 resize-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Website cá nhân</label>
          <input
            id="input-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com (tùy chọn)"
            className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all"
          />
        </div>
      </div>

      {/* Thông tin ngân hàng */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
          Thông tin ngân hàng{" "}
          <span className="text-xs font-normal text-zinc-400">(tùy chọn)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Tên ngân hàng</label>
            <input
              id="input-bank-name"
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Vietcombank, Techcombank..."
              className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Số tài khoản</label>
            <input
              id="input-bank-account-number"
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="0123456789"
              className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Tên chủ tài khoản</label>
          <input
            id="input-bank-account-name"
            type="text"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
            placeholder="NGUYEN VAN A"
            className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all font-mono"
          />
        </div>
      </div>

      {/* Lý do */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">3</span>
          Lý do đăng ký
        </h3>
        <textarea
          id="input-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Chia sẻ lý do bạn muốn trở thành tác giả, kinh nghiệm sáng tác..."
          rows={3}
          className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 resize-none transition-all"
        />
      </div>

      <Button
        id="btn-submit-author-request"
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
      >
        {isEditing ? "💾 Lưu chỉnh sửa" : "📤 Gửi yêu cầu nâng cấp"}
      </Button>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function DangKyTacGiaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);

  // Nếu đã là ADMIN hoặc MANAGER thì chuyển hướng
  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "MANAGER") {
      router.replace("/quan-ly/duyet-tac-gia");
    }
  }, [user, router]);

  // TanStack Query: Lấy trạng thái đăng ký tác giả
  const { data: statusData, isLoading: isLoadingStatus } = useMyAuthorStatus();

  // Mutations
  const createMutation = useCreateAuthorRequest();
  const updateMutation = useUpdateAuthorRequest();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleCreate = async (payload: CreateAuthorRequestPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      setShowEditForm(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleUpdate = async (payload: CreateAuthorRequestPayload) => {
    try {
      await updateMutation.mutateAsync(payload);
      setShowEditForm(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const hasExistingRequest = statusData?.request !== null && statusData?.request !== undefined;
  const isAuthor = statusData?.isAuthor ?? false;

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate">Đăng ký Tác giả</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">
              Chia sẻ tác phẩm của bạn với hàng nghìn độc giả trên StoryVN
            </p>
          </div>
        </div>

        {/* Benefits banner */}
        {!isAuthor && !hasExistingRequest && (
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 sm:p-5 text-white">
            <h2 className="font-bold text-base sm:text-lg mb-2">✨ Quyền lợi khi là Tác giả</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span>📖</span> <span>Đăng tải tác phẩm</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰</span> <span>Nhận nhuận bút</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👥</span> <span>Xây dựng fan base</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏆</span> <span>Huy hiệu Tác giả</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoadingStatus ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Đang kiểm tra trạng thái...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status card nếu đã có yêu cầu */}
          {(hasExistingRequest || isAuthor) && statusData && (
            <RequestStatusCard
              data={statusData}
              onEdit={() => setShowEditForm(true)}
            />
          )}

          {/* Form: hiển thị nếu chưa có request HOẶC đang edit */}
          {(!hasExistingRequest || showEditForm) && !isAuthor && (
            <>
              {showEditForm && (
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-zinc-900">Chỉnh sửa yêu cầu</h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hủy
                  </button>
                </div>
              )}

              <AuthorRequestForm
                initialData={
                  showEditForm && statusData?.request
                    ? {
                        penName: statusData.request.penName,
                        biography: statusData.request.biography ?? "",
                        website: statusData.request.website ?? "",
                        bankName: statusData.request.bankName ?? "",
                        bankAccountNumber: statusData.request.bankAccountNumber ?? "",
                        bankAccountName: statusData.request.bankAccountName ?? "",
                        reason: statusData.request.reason ?? "",
                      }
                    : undefined
                }
                onSubmit={showEditForm ? handleUpdate : handleCreate}
                isLoading={isSubmitting}
                isEditing={showEditForm}
              />
            </>
          )}

          {/* Trạng thái PENDING - không cho edit thêm */}
          {hasExistingRequest && statusData?.request?.status === "PENDING" && !showEditForm && (
            <div className="text-center text-sm text-zinc-400 py-4">
              Yêu cầu đang được xét duyệt. Vui lòng chờ phản hồi từ quản trị viên.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

