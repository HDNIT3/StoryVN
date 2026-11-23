"use client";

import type { CoinPackageItem } from "@/features/coin-packages/types";

interface Props {
  items: CoinPackageItem[];
  isLoading: boolean;
  page?: number;
  limit?: number;
  onEdit: (item: CoinPackageItem) => void;
  onDelete: (item: CoinPackageItem) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string | null;
}

export function CoinPackageTable({
  items,
  isLoading,
  page = 1,
  limit = 10,
  onEdit,
  onDelete,
  onToggleStatus,
  isTogglingId,
}: Props) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-admin-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="admin-data-table w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
              <th className="py-3.5 px-5 text-center w-14">STT</th>
              <th className="py-3.5 px-5 min-w-[180px]">Tên gói nạp</th>
              <th className="py-3.5 px-5 text-right">Giá tiền</th>
              <th className="py-3.5 px-5 text-center">Xu cơ bản</th>
              <th className="py-3.5 px-5 text-center">Xu thưởng</th>
              <th className="py-3.5 px-5 text-center">Tổng Xu</th>
              <th className="py-3.5 px-5 text-center w-20">Thứ tự</th>
              <th className="py-3.5 px-5 text-center">Trạng thái</th>
              <th className="py-3.5 px-5">Ngày tạo</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {isLoading && items.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-5 text-center">
                    <div className="h-4 bg-gray-200 rounded w-6 mx-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 ml-auto" />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="h-4 bg-gray-100 rounded w-12 mx-auto" />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="h-4 bg-gray-100 rounded w-12 mx-auto" />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="h-5 bg-amber-100 rounded-full w-16 mx-auto" />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="h-4 bg-gray-100 rounded w-8 mx-auto" />
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="h-6 bg-gray-200 rounded-full w-14 mx-auto" />
                  </td>
                  <td className="py-4 px-5">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="h-7 bg-gray-200 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-4 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-1 border border-amber-200/50">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-600">Không tìm thấy gói nạp nào</p>
                    <p className="text-xs text-gray-400">
                      Thử thay đổi bộ lọc tìm kiếm hoặc thêm gói nạp mới.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((pkg, idx) => {
                const index = (page - 1) * limit + idx + 1;
                const isToggling = isTogglingId === pkg._id;

                return (
                  <tr
                    key={pkg._id}
                    className="hover:bg-gray-50/70 transition-colors group"
                  >
                    {/* STT */}
                    <td className="py-4 px-5 text-center text-gray-400 font-mono text-sm">
                      {index}
                    </td>

                    {/* Tên gói & mô tả */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{pkg.name}</span>
                        {pkg.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white shadow-admin-card">
                            ★ HOT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Giá tiền */}
                    <td className="py-4 px-5 text-right">
                      <span className="font-medium text-admin-brand-700 bg-admin-brand-50/60 px-2 py-1 rounded-lg">
                        {formatCurrency(pkg.price)}
                      </span>
                    </td>

                    {/* Xu cơ bản */}
                    <td className="py-4 px-5 text-center font-medium text-gray-700">
                      {pkg.coinAmount.toLocaleString("vi-VN")}
                    </td>

                    {/* Xu thưởng */}
                    <td className="py-4 px-5 text-center">
                      {pkg.bonusCoin > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                          +{pkg.bonusCoin.toLocaleString("vi-VN")}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Tổng Xu */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200/80 shadow-admin-card">
                        <span className="text-amber-500 text-xs">🪙</span>
                        {pkg.totalCoin.toLocaleString("vi-VN")} Xu
                      </span>
                    </td>

                    {/* Thứ tự */}
                    <td className="py-4 px-5 text-center font-mono text-sm text-gray-500">
                      {pkg.sortOrder}
                    </td>

                    {/* Trạng thái Bật/Tắt */}
                    <td className="py-4 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(pkg._id)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                          pkg.isActive ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        title={pkg.isActive ? "Bấm để ẩn gói nạp" : "Bấm để kích hoạt gói nạp"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-admin-card ring-0 transition duration-200 ease-in-out ${
                            pkg.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Ngày tạo */}
                    <td className="py-4 px-5 text-sm text-gray-500">
                      {formatDate(pkg.createdAt)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(pkg)}
                          className="p-1.5 text-gray-400 hover:text-admin-brand-600 hover:bg-admin-brand-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa gói nạp"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(pkg)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa gói nạp"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
