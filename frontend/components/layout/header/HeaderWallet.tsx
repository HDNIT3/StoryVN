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
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/60 hover:bg-amber-50 border border-amber-200/80 rounded-full transition-all duration-150 select-none shadow-2xs ${className}`}
      title={`Số dư: ${coins.toLocaleString("vi-VN")} ${unit}`}
    >
      {/* Coin Icon from public/icon */}
      <div className="relative w-4 h-4 shrink-0">
        <Image
          src={iconSrc}
          alt="Icon đồng xu"
          width={16}
          height={16}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Balance Text */}
      <span className="text-xs sm:text-sm font-bold text-amber-800 whitespace-nowrap">
        {coins.toLocaleString("vi-VN")} {unit}
      </span>

      {/* Plus Recharge Button */}
      {showRechargeButton && (
        <button
          type="button"
          onClick={handleRecharge}
          aria-label="Nạp thêm xu"
          title="Nạp thêm xu"
          className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 transition-colors cursor-pointer"
        >
          <div className="relative w-3 h-3 shrink-0">
            <Image
              src="/icon/plus.svg"
              alt="Icon nạp xu"
              width={12}
              height={12}
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      )}
    </div>
  );
}
