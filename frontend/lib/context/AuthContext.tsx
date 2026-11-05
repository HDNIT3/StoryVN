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

// ─── Token helpers ────────────────────────────────────────────────
export const TOKEN_KEY = "accessToken";
export const REFRESH_KEY = "refreshToken";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
export function setAuthCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}
export function deleteAuthCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  setAuthCookie(TOKEN_KEY, access);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  deleteAuthCookie(TOKEN_KEY);
  deleteAuthCookie("user_role");
}

// ─── Provider ────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  // Fetch current profile từ API (token đã trong localStorage, api.ts tự gắn)
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    const token = getStoredAccessToken();
    if (!token) return null;

    try {
      const res = await userService.getProfile();
      const profile = res.data?.user ?? null;
      if (profile?.role) {
        setAuthCookie("user_role", profile.role);
      }
      return profile;
    } catch {
      // 401 đã được api.ts xử lý refresh rồi, nếu vẫn fail thì clear
      clearTokens();
      return null;
    }
  }, []);

  // Initialize trên mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetchProfile().then((profile) => {
      setUser(profile);
      if (profile?.role) {
        setAuthCookie("user_role", profile.role);
      }
      const token = getStoredAccessToken();
      if (token) {
        setAuthCookie(TOKEN_KEY, token);
      }
      setIsLoading(false);
    });
  }, [fetchProfile]);

  // Lắng nghe event auth:logout (khi api.ts không refresh được)
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      saveTokens(accessToken, refreshToken);
      const profile = await fetchProfile();
      setUser(profile);
      if (profile?.role) {
        setAuthCookie("user_role", profile.role);
      }
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
    if (profile?.role) {
      setAuthCookie("user_role", profile.role);
    }
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

