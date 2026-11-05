import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Giải mã JWT payload an toàn ở Edge Runtime mà không cần external library
 */
function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
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
  const { pathname } = request.nextUrl;

  const accessTokenCookie = request.cookies.get("accessToken")?.value;
  const userRoleCookie = request.cookies.get("user_role")?.value;

  // Lấy role từ JWT payload hoặc từ cookie user_role
  let userRole = userRoleCookie;
  let isTokenExpired = false;

  if (accessTokenCookie) {
    const payload = decodeJwtPayload(accessTokenCookie);
    if (payload) {
      if (payload.role) {
        userRole = payload.role;
      }
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        isTokenExpired = true;
      }
    }
  }

  const isAuthenticated = Boolean(accessTokenCookie && !isTokenExpired);

  // ─── 1. BẢO VỆ PHÂN HỆ QUẢN LÝ (/quan-ly/*) ──────────────────────
  if (pathname.startsWith("/quan-ly")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/ho-so", request.url));
    }
  }

  // ─── 2. BẢO VỆ PHÂN HỆ TÁC GIẢ (/tac-gia/*) ──────────────────────
  if (pathname.startsWith("/tac-gia")) {
    // Riêng trang đăng ký làm tác giả: cho phép truy cập
    if (pathname === "/tac-gia/dang-ky" || pathname.startsWith("/tac-gia/dang-ky")) {
      return NextResponse.next();
    }

    // Các trang quản lý tác giả khác (/tac-gia/tong-quan, /tac-gia/tac-pham, /tac-gia/chuong-truyen, v.v.):
    // Yêu cầu phải đăng nhập
    if (!isAuthenticated) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // PHƯƠNG ÁN 1: Chỉ duy nhất AUTHOR được phép truy cập phân hệ tác giả
    // Bất kỳ role nào khác (kể cả ADMIN, MANAGER hay USER) đều nhận trang 404 Not Found
    if (userRole && userRole !== "AUTHOR") {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }
  }

  // ─── 3. TRANG XÁC THỰC (/dang-nhap, /dang-ky) ───────────────────
  // Nếu đã đăng nhập thành công thì không cần hiển thị lại form đăng nhập/đăng ký
  if (pathname === "/dang-nhap" || pathname === "/dang-ky") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/quan-ly/:path*",
    "/tac-gia/:path*",
    "/dang-nhap",
    "/dang-ky",
  ],
};
