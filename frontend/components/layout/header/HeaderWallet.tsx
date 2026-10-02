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
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-amber-50 hover:bg-amber-100/60 border border-amber-200 rounded-full transition-all duration-150 select-none shadow-xs shrink-0 ${className}`}
      title={`Số dư: ${coins.toLocaleString("vi-VN")} ${unit}`}
    >
      {/* Coin Icon from public/icon */}
      <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0">
        <Image
          src={iconSrc}
          alt="Icon đồng xu"
          width={16}
          height={16}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Balance Text */}
      <span className="text-xs font-bold text-amber-900 whitespace-nowrap">
        {coins.toLocaleString("vi-VN")} <span className="hidden sm:inline">{unit}</span>
      </span>

      {/* Plus Recharge Button */}
      {showRechargeButton && (
        <button
          type="button"
          onClick={handleRecharge}
          aria-label="Nạp thêm xu"
          title="Nạp thêm xu"
          className="ml-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer shrink-0"
        >
          <div className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0">
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
