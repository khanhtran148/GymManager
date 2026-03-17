"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

function setAuthCookie(isAuthenticated: boolean): void {
  if (typeof document === "undefined") return;
  if (isAuthenticated) {
    document.cookie = "is_authenticated=1; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "is_authenticated=; path=/; max-age=0; SameSite=Lax";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (response: AuthResponse) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
        }
        setAuthCookie(true);
        set({
          user: { userId: response.userId, email: response.email, fullName: response.fullName },
          token: response.accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
        }
        setAuthCookie(false);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
