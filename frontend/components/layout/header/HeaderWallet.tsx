"use client";

import React from "react";
import Image from "next/image";
import { WalletInfo } from "./header.types";
import { DEFAULT_WALLET } from "./header.constants";

interface HeaderWalletProps {
  wallet?: WalletInfo;
  onRechargeClick?: () => void;
  className?: string;
  showRechargeButton?: boolean;
}

export function HeaderWallet({
  wallet = DEFAULT_WALLET,
  onRechargeClick,
  className = "",
  showRechargeButton = true,
}: HeaderWalletProps) {
  const coins = wallet.coins ?? 0;
  const unit = wallet.unit ?? "Xu";
  const iconSrc = wallet.coinIconSrc ?? "/icon/coin.svg";

  const handleRecharge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRechargeClick) {
      onRechargeClick();
    } else if (wallet.onRechargeClick) {
      wallet.onRechargeClick();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100/60 border border-amber-200 rounded-full transition-all duration-150 select-none shadow-xs ${className}`}
      title={`Số dư: ${coins.toLocaleString("vi-VN")} ${unit}`}
    >
      {/* Coin Icon from public/icon */}
      <div className="relative w-5 h-5 shrink-0">
        <Image
          src={iconSrc}
          alt="Icon đồng xu"
          width={20}
          height={20}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Balance Text */}
      <span className="text-sm sm:text-base font-bold text-amber-900 whitespace-nowrap">
        {coins.toLocaleString("vi-VN")} {unit}
      </span>

      {/* Plus Recharge Button */}
      {showRechargeButton && (
        <button
          type="button"
          onClick={handleRecharge}
          aria-label="Nạp thêm xu"
          title="Nạp thêm xu"
          className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
        >
          <div className="relative w-3.5 h-3.5 shrink-0">
            <Image
              src="/icon/plus.svg"
              alt="Icon nạp xu"
              width={14}
              height={14}
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      )}
    </div>
  );
}
