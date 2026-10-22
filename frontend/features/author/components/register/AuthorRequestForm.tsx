"use client";

import React, { useState } from "react";
import type { CreateAuthorRequestPayload } from "@/features/author";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";

interface AuthorRequestFormProps {
  initialData?: CreateAuthorRequestPayload;
  onSubmit: (payload: CreateAuthorRequestPayload) => Promise<void>;
  isLoading: boolean;
  isEditing?: boolean;
}

export function AuthorRequestForm({
  initialData,
  onSubmit,
  isLoading,
  isEditing,
}: AuthorRequestFormProps) {
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
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">
            1
          </span>
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
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">
            2
          </span>
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
          <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xs font-bold">
            3
          </span>
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
