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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/${endpoint.replace(/^\//, "")}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
