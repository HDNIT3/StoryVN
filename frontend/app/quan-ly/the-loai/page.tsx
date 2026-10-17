"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import type { CategoryItem } from "@/types/category";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSeedCategories,
  useUpdateCategory,
} from "@/lib/hooks/queries/useCategoryQuery";
import { CategoryFilterBar } from "@/components/admin/categories/CategoryFilterBar";
import { CategoryTable } from "@/components/admin/categories/CategoryTable";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";
import { CategoryDeleteModal } from "@/components/admin/categories/CategoryDeleteModal";
import { CategoryPagination } from "@/components/admin/categories/CategoryPagination";
import { AdminStatCard } from "@/components/admin/common/AdminStatCard";

export default function QuanLyTheLoaiPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // Queries & Mutations
  const isActiveParam =
    statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined;

  const { data, isLoading, refetch } = useCategories({
    page,
    limit: 10,
    search: search.trim() || undefined,
    isActive: isActiveParam,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Query tổng thể loại để đếm số lượng hiển thị trên StatCards
  const { data: allCategoriesData } = useCategories({
    page: 1,
    limit: 100,
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const seedMutation = useSeedCategories();

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.totalItems ?? items.length;

  const allItems = allCategoriesData?.items ?? items;
  const totalCategories = allCategoriesData?.pagination?.totalItems ?? allItems.length;
  const activeCount = allItems.filter((c) => c.isActive).length;
  const inactiveCount = allItems.filter((c) => !c.isActive).length;

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
    setSelectedCategory(null);
    setFormModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setFormModalOpen(true);
  };

  // Mở modal xác nhận xóa
  const handleOpenDelete = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Xử lý submit form (Tạo mới hoặc Sửa)
  const handleFormSubmit = async (formData: {
    name: string;
    slug?: string;
    description?: string;
    isActive: boolean;
  }) => {
    if (selectedCategory) {
      await updateMutation.mutateAsync({
        id: selectedCategory._id,
        payload: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  // Xử lý xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteMutation.mutateAsync(categoryToDelete._id);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  // Xử lý nạp dữ liệu thể loại mẫu
  const handleSeed = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn nạp danh sách thể loại / danh mục mặc định vào cơ sở dữ liệu?"
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
            Quản lý Thể loại / Danh mục
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý các thể loại truyện chính (như Tiên hiệp, Kiếm hiệp, Huyền huyễn, Đô thị...)
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
            {seedMutation.isPending ? "Đang nạp..." : "Nạp thể loại mẫu"}
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
            Thêm thể loại
          </Button>
        </div>
      </div>

      {/* ── Stat Cards (Đồng bộ chuẩn 100% như trang quản lý người dùng) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Tổng thể loại"
          value={totalCategories}
          color="border-sky-100 text-sky-800"
          isActive={statusFilter === "ALL"}
          onClick={() => handleStatusFilterChange("ALL")}
          icon={
            <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
        <AdminStatCard
          label="Đang hoạt động"
          value={activeCount}
          color="border-emerald-100 text-emerald-800"
          isActive={statusFilter === "ACTIVE"}
          onClick={() => handleStatusFilterChange("ACTIVE")}
          icon={
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <AdminStatCard
          label="Đang ẩn / Khóa"
          value={inactiveCount}
          color="border-amber-100 text-amber-800"
          isActive={statusFilter === "INACTIVE"}
          onClick={() => handleStatusFilterChange("INACTIVE")}
          icon={
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          }
        />
        <AdminStatCard
          label="Hiển thị theo trang"
          value={items.length}
          color="border-purple-100 text-purple-800"
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <CategoryFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        isLoading={isLoading}
        totalItems={totalItems}
        onRefresh={() => refetch()}
      />

      {/* Bảng danh sách thể loại */}
      <CategoryTable
        items={items}
        isLoading={isLoading}
        page={page}
        limit={10}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Phân trang */}
      <CategoryPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal Tạo mới / Chỉnh sửa */}
      <CategoryFormModal
        open={formModalOpen}
        category={selectedCategory}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Modal Xác nhận xóa */}
      <CategoryDeleteModal
        open={deleteModalOpen}
        category={categoryToDelete}
        isLoading={deleteMutation.isPending}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
