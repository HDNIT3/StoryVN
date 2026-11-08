import { toast } from "./toast";
import {
  clearTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  isJwtExpired,
  saveTokens,
  syncSessionCookies,
} from "./auth-tokens";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface ApiRequestInit extends RequestInit {
  skipAuthLogout?: boolean;
}

export type RefreshTokenResult =
  | { status: "refreshed"; token: string }
  | { status: "unauthorized" }
  | { status: "transient_error" };

const AUTH_CREDENTIAL_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-register",
  "/auth/resend-register-otp",
  "/auth/google",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isAuthCredentialEndpoint(endpoint: string): boolean {
  let path = endpoint;
  if (endpoint.startsWith("http")) {
    try {
      path = new URL(endpoint).pathname;
    } catch {
      path = endpoint;
    }
  }
  path = path.split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.startsWith("/api/")) {
    path = path.slice(4);
  }
  return AUTH_CREDENTIAL_PATHS.some(
    (authPath) => path === authPath || path.startsWith(`${authPath}/`)
  );
}

// ─── Refresh token coordination (intra-tab + cross-tab lock) ──────
let _refreshPromise: Promise<RefreshTokenResult> | null = null;

async function runWithCrossTabRefreshLock(
  task: () => Promise<RefreshTokenResult>
): Promise<RefreshTokenResult> {
  if (
    typeof navigator !== "undefined" &&
    navigator.locks &&
    typeof navigator.locks.request === "function"
  ) {
    return navigator.locks.request("storyvn_auth_refresh", () => task());
  }
  return task();
}

async function doRefreshToken(
  failedAccessToken?: string | null
): Promise<RefreshTokenResult> {
  return runWithCrossTabRefreshLock(async () => {
    const latestAccessToken = getStoredAccessToken();
    if (
      latestAccessToken &&
      latestAccessToken !== failedAccessToken &&
      !isJwtExpired(latestAccessToken, 5)
    ) {
      syncSessionCookies(latestAccessToken);
      return { status: "refreshed", token: latestAccessToken };
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return { status: "unauthorized" };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const currentRefreshToken = getStoredRefreshToken();
        const currentAccessToken = getStoredAccessToken();
        if (
          currentRefreshToken &&
          currentRefreshToken !== refreshToken &&
          currentAccessToken &&
          !isJwtExpired(currentAccessToken, 5)
        ) {
          syncSessionCookies(currentAccessToken);
          return { status: "refreshed", token: currentAccessToken };
        }

        clearTokens();
        return { status: "unauthorized" };
      }

      if (!res.ok) {
        return { status: "transient_error" };
      }

      const data = await res.json();
      if (data?.data?.accessToken) {
        const nextAccessToken = String(data.data.accessToken);
        const nextRefreshToken =
          typeof data.data.refreshToken === "string" &&
          data.data.refreshToken.length > 0
            ? data.data.refreshToken
            : refreshToken;
        saveTokens(nextAccessToken, nextRefreshToken);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:token-refreshed", {
              detail: { accessToken: nextAccessToken },
            })
          );
        }
        return { status: "refreshed", token: nextAccessToken };
      }

      return { status: "transient_error" };
    } catch {
      return { status: "transient_error" };
    }
  });
}

export async function ensureTokenRefreshed(
  failedAccessToken?: string | null
): Promise<RefreshTokenResult> {
  if (!_refreshPromise) {
    _refreshPromise = doRefreshToken(failedAccessToken).finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

// ─── ApiClient ────────────────────────────────────────────────────
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T = any>(
    endpoint: string,
    options: ApiRequestInit = {},
    retry = true
  ): Promise<T> {
    const { skipAuthLogout, headers: optionHeaders, ...fetchOptions } = options;

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

    const isFormData =
      typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

    const requestToken = getStoredAccessToken();
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      ...(optionHeaders as Record<string, string> | undefined),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    } catch (networkError: any) {
      const error: ApiError = {
        message: "Website chưa hoạt động vui lòng chờ",
        statusCode: 0,
        error: networkError?.message,
      };
      if (typeof window !== "undefined") {
        toast.error(error.message);
      }
      throw error;
    }

    // 401 → thử refresh token một lần (trừ các endpoint xác thực & khi chưa đăng nhập)
    if (
      response.status === 401 &&
      retry &&
      !isAuthCredentialEndpoint(endpoint)
    ) {
      const hasAnyToken = Boolean(requestToken || getStoredRefreshToken());
      if (hasAnyToken) {
        const currentToken = getStoredAccessToken();
        if (
          currentToken &&
          currentToken !== requestToken &&
          !isJwtExpired(currentToken, 5)
        ) {
          return this.request<T>(endpoint, options, false);
        }

        const refreshResult = await ensureTokenRefreshed(requestToken);
        if (refreshResult.status === "refreshed") {
          return this.request<T>(endpoint, options, false);
        }
        if (refreshResult.status === "transient_error") {
          const error: ApiError = {
            message: "Website chưa hoạt động vui lòng chờ",
            statusCode: 503,
          };
          throw error;
        }

        // refresh thất bại thực sự → xóa phiên & logout mềm
        clearTokens();
        if (!skipAuthLogout && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        const error: ApiError = {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          statusCode: 401,
        };
        throw error;
      }
    }

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMessage =
        (typeof data === "object" && (data.message || data.error)) ||
        response.statusText;

      if (
        !errorMessage ||
        errorMessage === "Failed to fetch" ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        errorMessage = "Website chưa hoạt động vui lòng chờ";
      }

      const error: ApiError = {
        message: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
        statusCode: response.status,
      };
      throw error;
    }

    return data as T;
  }

  get<T = any>(endpoint: string, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T = any>(endpoint: string, body?: any, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  upload<T = any>(endpoint: string, formData: FormData, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  delete<T = any>(endpoint: string, options?: ApiRequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
