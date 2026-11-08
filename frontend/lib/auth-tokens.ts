export const TOKEN_KEY = "accessToken";
export const REFRESH_KEY = "refreshToken";
export const USER_ROLE_COOKIE = "user_role";
export const HAS_SESSION_COOKIE = "has_refresh_token";

export interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Giải mã JWT payload an toàn trên browser (không verify chữ ký, chỉ đọc metadata phiên)
 */
export function decodeJwtPayloadClient(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLength);
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, bufferSeconds = 0): boolean {
  const payload = decodeJwtPayloadClient(token);
  if (!payload) return true;
  if (typeof payload.exp !== "number") return false;
  return Date.now() + bufferSeconds * 1000 >= payload.exp * 1000;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setAuthCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax${secure}`;
}

export function deleteAuthCookie(name: string) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
  if (secure) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

export function syncSessionCookies(
  accessToken: string | null,
  role?: string | null,
  hasRefreshToken?: boolean
) {
  if (typeof document === "undefined") return;

  if (accessToken) {
    // Giữ cookie tồn tại theo hạn refreshToken (7d) để middleware biết vẫn còn phiên refresh được
    setAuthCookie(TOKEN_KEY, accessToken, 7);
  } else {
    deleteAuthCookie(TOKEN_KEY);
  }

  const refreshPresent =
    typeof hasRefreshToken === "boolean"
      ? hasRefreshToken
      : Boolean(getStoredRefreshToken());
  if (refreshPresent) {
    setAuthCookie(HAS_SESSION_COOKIE, "1", 7);
  } else {
    deleteAuthCookie(HAS_SESSION_COOKIE);
  }

  const resolvedRole =
    role || (accessToken ? decodeJwtPayloadClient(accessToken)?.role : undefined);
  if (resolvedRole) {
    setAuthCookie(USER_ROLE_COOKIE, resolvedRole, 7);
  } else if (role === null) {
    deleteAuthCookie(USER_ROLE_COOKIE);
  }
}

export function saveTokens(access: string, refresh?: string | null) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TOKEN_KEY, access);
      if (typeof refresh === "string" && refresh.length > 0) {
        localStorage.setItem(REFRESH_KEY, refresh);
      }
    } catch {
      // ignore storage quota/privacy mode errors
    }
  }
  const resolvedRole = decodeJwtPayloadClient(access)?.role ?? null;
  syncSessionCookies(
    access,
    resolvedRole,
    Boolean(refresh || getStoredRefreshToken())
  );
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // ignore
    }
  }
  deleteAuthCookie(TOKEN_KEY);
  deleteAuthCookie(USER_ROLE_COOKIE);
  deleteAuthCookie(HAS_SESSION_COOKIE);
}

