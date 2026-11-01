const FALLBACK_RETURN_URL = "/";

/**
 * Chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng "/" và không phải "//").
 * Mục đích: sau khi đăng nhập quay lại đúng trang, đồng thời chặn open-redirect
 * sang URL bên ngoài qua tham số returnUrl.
 */
export function sanitizeReturnUrl(value: string | null | undefined): string {
  if (!value) return FALLBACK_RETURN_URL;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return FALLBACK_RETURN_URL;
  }
  if (/[\u0000-\u001F\u007F]/.test(candidate)) {
    return FALLBACK_RETURN_URL;
  }

  try {
    const base = "http://internal.local";
    const resolved = new URL(candidate, base);
    if (resolved.origin !== base) return FALLBACK_RETURN_URL;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return FALLBACK_RETURN_URL;
  }
}

/**
 * Đọc returnUrl từ query của trang đăng nhập (ví dụ "/dang-nhap?returnUrl=...").
 */
export function getLoginReturnUrl(): string {
  if (typeof window === "undefined") return FALLBACK_RETURN_URL;
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnUrl(params.get("returnUrl"));
}

export { FALLBACK_RETURN_URL };
