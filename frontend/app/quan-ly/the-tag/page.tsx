"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import type { TagItem } from "@/types/tag";
import {
  useCreateTag,
  useDeleteTag,
  useSeedTags,
  useTags,
  useUpdateTag,
} from "@/lib/hooks/queries/useTagQuery";
import { TagFilterBar } from "@/components/admin/tags/TagFilterBar";
import { TagTable } from "@/components/admin/tags/TagTable";
import { TagFormModal } from "@/components/admin/tags/TagFormModal";
import { TagDeleteModal } from "@/components/admin/tags/TagDeleteModal";
import { TagPagination } from "@/components/admin/tags/TagPagination";

export default function QuanLyTagPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagItem | null>(null);

  // Queries & Mutations
  const isActiveParam =
    statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined;

  const { data, isLoading, refetch } = useTags({
    page,
    limit: 10,
    search: search.trim() || undefined,
    isActive: isActiveParam,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();
  const seedMutation = useSeedTags();

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.totalItems ?? items.length;

  // Xử lý đổi filter hoặc search -> reset về trang 1
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (status: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusFilter(status);
    setPage(1);
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setSelectedTag(null);
    setFormModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (tag: TagItem) => {
    setSelectedTag(tag);
    setFormModalOpen(true);
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (tag: TagItem) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  // Xử lý submit form (Tạo mới hoặc Sửa)
  const handleFormSubmit = async (formData: {
    name: string;
    slug?: string;
    isActive: boolean;
  }) => {
    if (selectedTag) {
      await updateMutation.mutateAsync({
        id: selectedTag._id,
        payload: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    try {
      await deleteMutation.mutateAsync(tagToDelete._id);
      setDeleteModalOpen(false);
      setTagToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  // Xử lý nạp dữ liệu tag mẫu
  const handleSeed = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn nạp danh sách thẻ tag mặc định vào cơ sở dữ liệu?"
    );
    if (!confirmed) return;
    await seedMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Thẻ Tag
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý các thẻ phân loại đặc trưng của truyện (như Hệ thống, Xuyên không, Trùng sinh...)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seedMutation.isPending}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            leftIcon={
              <svg
                className={`w-4 h-4 text-slate-500 ${
                  seedMutation.isPending ? "animate-spin" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            }
          >
            {seedMutation.isPending ? "Đang nạp..." : "Nạp tag mẫu"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="bg-sky-500 hover:bg-sky-600 text-white shadow-xs font-semibold"
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Thêm thẻ tag
          </Button>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <TagFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        isLoading={isLoading}
        totalItems={totalItems}
        onRefresh={() => refetch()}
      />

      {/* Bảng danh sách thẻ tag */}
      <TagTable
        items={items}
        isLoading={isLoading}
        page={page}
        limit={10}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Phân trang */}
      <TagPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal Tạo mới / Chỉnh sửa */}
      <TagFormModal
        open={formModalOpen}
        tag={selectedTag}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedTag(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Modal Xác nhận xóa */}
      <TagDeleteModal
        open={deleteModalOpen}
        tag={tagToDelete}
        isLoading={deleteMutation.isPending}
        onClose={() => {
          setDeleteModalOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
