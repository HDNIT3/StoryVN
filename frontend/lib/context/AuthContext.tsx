"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { UserProfile } from "@/features/user";
import { userService } from "@/features/user";
import { authService } from "@/features/auth";
import { ensureTokenRefreshed } from "@/lib/api";
import {
  TOKEN_KEY,
  REFRESH_KEY,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthCookie,
  deleteAuthCookie,
  saveTokens,
  clearTokens,
  syncSessionCookies,
  isJwtExpired,
} from "@/lib/auth-tokens";

export {
  TOKEN_KEY,
  REFRESH_KEY,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthCookie,
  deleteAuthCookie,
  saveTokens,
  clearTokens,
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  // Fetch current profile từ API (tự refresh thầm lặng nếu accessToken sắp/đã hết hạn nhưng còn refreshToken)
  const fetchProfile = useCallback(
    async (options?: {
      silentAuthFailure?: boolean;
    }): Promise<UserProfile | null> => {
      let token = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!token && !refreshToken) {
        clearTokens();
        return null;
      }

      if ((!token || isJwtExpired(token, 10)) && refreshToken) {
        const refreshResult = await ensureTokenRefreshed(token);
        if (refreshResult.status === "refreshed") {
          token = refreshResult.token;
        } else if (refreshResult.status === "unauthorized") {
          clearTokens();
          if (!options?.silentAuthFailure && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:logout"));
          }
          return null;
        } else {
          // Lỗi mạng / 5xx tạm thời → giữ nguyên token, không đăng xuất oan người dùng
          return null;
        }
      }

      if (!token) {
        clearTokens();
        return null;
      }

      try {
        const res = await userService.getProfile({
          skipAuthLogout: options?.silentAuthFailure,
        });
        const profile = res.data?.user ?? null;
        const latestToken = getStoredAccessToken();
        syncSessionCookies(latestToken, profile?.role ?? null);
        return profile;
      } catch (err: unknown) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? Number((err as { statusCode?: unknown }).statusCode)
            : undefined;
        // Chỉ xóa phiên khi thực sự bị từ chối xác thực (401/403), không xóa khi lỗi mạng/5xx
        if (statusCode === 401 || statusCode === 403) {
          clearTokens();
        }
        return null;
      }
    },
    []
  );

  // Initialize trên mount (silentAuthFailure: true để khách mở trang công khai không bị đá sang /dang-nhap nếu phiên cũ đã hết hạn)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetchProfile({ silentAuthFailure: true })
      .then((profile) => {
        setUser(profile);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchProfile]);

  // Lắng nghe event auth:logout (khi 401 không refresh được)
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // Đồng bộ đăng nhập / đăng xuất giữa các tab
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY && event.key !== null) return;

      const currentToken = getStoredAccessToken();
      if (!currentToken) {
        setUser(null);
        return;
      }

      syncSessionCookies(currentToken);
      if (!user) {
        fetchProfile({ silentAuthFailure: true }).then((profile) => {
          setUser(profile);
        });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user, fetchProfile]);

  // Khi người dùng quay lại tab sau một thời gian, chủ động làm mới token/cookie nếu sắp hoặc đã hết hạn
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const token = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();
      if ((!token || isJwtExpired(token, 60)) && refreshToken) {
        ensureTokenRefreshed(token).then((result) => {
          if (result.status === "unauthorized") {
            setUser(null);
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      saveTokens(accessToken, refreshToken);
      const profile = await fetchProfile();
      setUser(profile);
      syncSessionCookies(getStoredAccessToken(), profile?.role ?? null);
    },
    [fetchProfile]
  );

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      await authService.logout({ refreshToken: refreshToken ?? undefined });
    } catch {
      // ignore
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchProfile();
    setUser(profile);
    syncSessionCookies(getStoredAccessToken(), profile?.role ?? null);
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

