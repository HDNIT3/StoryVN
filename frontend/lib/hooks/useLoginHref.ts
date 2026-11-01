"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sanitizeReturnUrl } from "@/lib/utils/returnUrl";

type LoginReturnTab = "comments" | "ratings";

/**
 * Tạo link đăng nhập kèm đường dẫn quay lại trang hiện tại.
 * tab: tab cần mở lại sau khi đăng nhập (bình luận / đánh giá).
 */
export function useLoginHref(tab?: LoginReturnTab) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab) params.set("tab", tab);
    const query = params.toString();
    const target = sanitizeReturnUrl(
      `${pathname}${query ? `?${query}` : ""}`
    );
    return `/dang-nhap?returnUrl=${encodeURIComponent(target)}`;
  }, [pathname, searchParams, tab]);
}

export type { LoginReturnTab };
