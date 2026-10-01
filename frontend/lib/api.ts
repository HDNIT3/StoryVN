import { toast } from "./toast";

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

// ─── Token helpers ────────────────────────────────────────────────
const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
function saveTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Singleton refresh promise ────────────────────────────────────
let _refreshPromise: Promise<string | null> | null = null;

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    if (data?.data?.accessToken) {
      saveTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }
    clearTokens();
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

async function ensureTokenRefreshed(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = doRefreshToken().finally(() => {
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

  private getAuthHeader(): Record<string, string> {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string>),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
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

    // 401 → thử refresh token một lần
    if (response.status === 401 && retry) {
      const newToken = await ensureTokenRefreshed();
      if (newToken) {
        return this.request<T>(endpoint, options, false);
      }
      // refresh thất bại → logout mềm
      clearTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      const error: ApiError = { message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", statusCode: 401 };
      throw error;
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

  get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  upload<T = any>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
