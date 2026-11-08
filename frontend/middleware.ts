import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTHOR_STUDIO_PREFIXES = [
  "/tac-gia/tong-quan",
  "/tac-gia/tac-pham",
  "/tac-gia/chuong-truyen",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Giải mã JWT payload an toàn ở Edge Runtime mà không cần external library
 */
function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessTokenCookie = request.cookies.get("accessToken")?.value;
  const userRoleCookie = request.cookies.get("user_role")?.value;
  const hasRefreshTokenCookie = request.cookies.get("has_refresh_token")?.value === "1";

  const payload = accessTokenCookie ? decodeJwtPayload(accessTokenCookie) : null;
  // Ưu tiên user_role cookie (được cập nhật từ DB khi đổi vai trò), fallback về role trong JWT
  const userRole = userRoleCookie || payload?.role;

  const isAccessTokenValid = Boolean(
    payload?.sub && (!payload.exp || Date.now() < payload.exp * 1000)
  );
  // Nếu accessToken hết hạn (15m) nhưng vẫn còn phiên refreshToken (7d),
  // cho phép đi tiếp để client AuthProvider + api.ts tự refresh thầm lặng thay vì đá về /dang-nhap
  const hasRefreshableSession =
    isAccessTokenValid || hasRefreshTokenCookie || Boolean(payload?.sub);

  // ─── 1. BẢO VỆ PHÂN HỆ QUẢN LÝ (/quan-ly/*) ──────────────────────
  if (matchesRoutePrefix(pathname, "/quan-ly")) {
    if (!hasRefreshableSession) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("returnUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/ho-so", request.url));
    }
  }

  // ─── 2. BẢO VỆ PHÂN HỆ STUDIO TÁC GIẢ ───────────────────────────
  // Không chặn các route công khai (/tac-gia, /tac-gia/[username]) hay trang /tac-gia/dang-ky
  const isAuthorStudioRoute = AUTHOR_STUDIO_PREFIXES.some((prefix) =>
    matchesRoutePrefix(pathname, prefix)
  );

  if (isAuthorStudioRoute) {
    if (!hasRefreshableSession) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("returnUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // PHƯƠNG ÁN 1: Chỉ duy nhất AUTHOR được phép truy cập phân hệ tác giả
    // Bất kỳ role nào khác (kể cả ADMIN, MANAGER hay USER) đều nhận trang 404 Not Found
    if (userRole && userRole !== "AUTHOR") {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }
  }

  // ─── 3. TRANG XÁC THỰC (/dang-nhap, /dang-ky) ───────────────────
  // Chỉ redirect về "/" khi accessToken còn hạn thực sự để tránh loop khi token hết hạn
  if (pathname === "/dang-nhap" || pathname === "/dang-ky") {
    if (isAccessTokenValid) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/quan-ly/:path*",
    "/tac-gia/tong-quan/:path*",
    "/tac-gia/tac-pham/:path*",
    "/tac-gia/chuong-truyen/:path*",
    "/dang-nhap",
    "/dang-ky",
  ],
};
