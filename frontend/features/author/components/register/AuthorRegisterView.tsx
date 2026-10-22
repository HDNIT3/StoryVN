"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  useMyAuthorStatus,
  useCreateAuthorRequest,
  useUpdateAuthorRequest,
  CreateAuthorRequestPayload,
} from "@/features/author";
import { RequestStatusCard } from "./RequestStatusCard";
import { AuthorRequestForm } from "./AuthorRequestForm";
import { AuthorBenefitsSidebar } from "./AuthorBenefitsSidebar";

export function AuthorRegisterView() {
  const { user } = useAuth();
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);

  // If role is ADMIN or MANAGER, redirect to management
  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "MANAGER") {
      router.replace("/quan-ly/duyet-tac-gia");
    }
  }, [user, router]);

  const { data: statusData, isLoading: isLoadingStatus } = useMyAuthorStatus();

  const createMutation = useCreateAuthorRequest();
  const updateMutation = useUpdateAuthorRequest();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleCreate = async (payload: CreateAuthorRequestPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      setShowEditForm(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleUpdate = async (payload: CreateAuthorRequestPayload) => {
    try {
      await updateMutation.mutateAsync(payload);
      setShowEditForm(false);
    } catch {
      // Error handled by mutation
    }
  };

  const hasExistingRequest = statusData?.request !== null && statusData?.request !== undefined;
  const isAuthor = statusData?.isAuthor ?? false;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {isLoadingStatus ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Đang kiểm tra trạng thái...</p>
        </div>
      ) : isAuthor && statusData ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              title="Quay lại"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Không gian Tác giả</h1>
              <p className="text-xs sm:text-sm text-zinc-500">
                Tài khoản của bạn đã được chứng nhận Tác giả chính thức
              </p>
            </div>
          </div>
          <RequestStatusCard data={statusData} onEdit={() => setShowEditForm(true)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <AuthorBenefitsSidebar />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {hasExistingRequest && statusData && (
              <RequestStatusCard
                data={statusData}
                onEdit={() => setShowEditForm(true)}
              />
            )}

            {(!hasExistingRequest || showEditForm) && !isAuthor && (
              <div className="space-y-4">
                {showEditForm && (
                  <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 p-4">
                    <h2 className="text-sm font-bold text-zinc-900">Chỉnh sửa thông tin đăng ký</h2>
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hủy bỏ
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
              </div>
            )}

            {hasExistingRequest && statusData?.request?.status === "PENDING" && !showEditForm && (
              <div className="text-center text-sm text-zinc-500 bg-white rounded-2xl border border-zinc-200 p-8">
                Yêu cầu của bạn đang được xét duyệt. Ban quản trị StoryVN sẽ sớm phản hồi kết quả!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
