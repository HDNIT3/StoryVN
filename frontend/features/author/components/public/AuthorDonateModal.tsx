import React from "react";
import type { PublicAuthorProfile } from "@/features/author";

interface AuthorDonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: PublicAuthorProfile;
  vietQrUrl: string | null;
  onCopyBankAccount: (accNumber: string) => void;
  isCopiedBank: boolean;
}

export function AuthorDonateModal({
  isOpen,
  onClose,
  author,
  vietQrUrl,
  onCopyBankAccount,
  isCopiedBank,
}: AuthorDonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#EDE7DF] shadow-2xl p-6 sm:p-7 overflow-hidden text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl border border-amber-200">
          ☕
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
          Ủng Hộ Tác Giả {author.penName}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Tiếp thêm một cốc cà phê động viên tác giả sáng tác chương mới
        </p>

        {/* VietQR */}
        {vietQrUrl && (
          <div className="mt-4 flex flex-col items-center p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE7DF]">
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-white p-1.5 border border-[#EDE7DF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vietQrUrl}
                alt="Mã VietQR ủng hộ tác giả"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] text-stone-500 mt-2">
              Quét mã QR bằng ứng dụng ngân hàng để ủng hộ nhanh
            </span>
          </div>
        )}

        {/* Bank info */}
        <div className="mt-4 space-y-2 text-xs sm:text-sm text-left bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE7DF]">
          <div className="flex justify-between py-0.5">
            <span className="text-stone-500">Ngân hàng:</span>
            <span className="font-semibold text-stone-900">{author.donateInfo?.bankName}</span>
          </div>
          <div className="flex justify-between py-0.5 border-t border-[#EDE7DF]">
            <span className="text-stone-500">Chủ tài khoản:</span>
            <span className="font-semibold text-stone-900 uppercase">
              {author.donateInfo?.bankAccountName || author.penName}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-t border-[#EDE7DF]">
            <span className="text-stone-500">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#8B1E2D]">
                {author.donateInfo?.bankAccountNumber}
              </span>
              <button
                type="button"
                onClick={() => onCopyBankAccount(author.donateInfo?.bankAccountNumber || "")}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white text-stone-800 border border-[#EDE7DF] hover:bg-stone-50 cursor-pointer"
              >
                {isCopiedBank ? "Đã chép!" : "Sao chép"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#8B1E2D] hover:bg-[#721422] text-white transition-colors cursor-pointer shadow-xs"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
