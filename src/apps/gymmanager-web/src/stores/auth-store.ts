"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, AuthUser } from "@/types/auth";
import { decodePermissionClaims } from "@/lib/jwt";
import type { RoleType } from "@/lib/roles";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: RoleType | null;
  permissions: bigint;
  login: (response: AuthResponse) => void;
  logout: () => void;
  updateFromToken: (token: string) => void;
}

const SECURE_FLAG = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function setAuthCookie(isAuthenticated: boolean): void {
  if (typeof document === "undefined") return;
  if (isAuthenticated) {
    document.cookie = `is_authenticated=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${SECURE_FLAG}`;
  } else {
    document.cookie = "is_authenticated=; path=/; max-age=0; SameSite=Lax";
  }
}

function setRoleCookie(role: string | null): void {
  if (typeof document === "undefined") return;
  if (role) {
    document.cookie = `user_role=${role}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${SECURE_FLAG}`;
  } else {
    document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
  }
}

function extractRoleAndPermissions(accessToken: string): {
  role: RoleType | null;
  permissions: bigint;
} {
  const claims = decodePermissionClaims(accessToken);
  if (!claims) return { role: null, permissions: 0n };
  return {
    role: (claims.role as RoleType) ?? null,
    permissions: claims.permissions ? BigInt(claims.permissions) : 0n,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
      permissions: 0n,

      login: (response: AuthResponse) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
        }
        const { role, permissions } = extractRoleAndPermissions(response.accessToken);
        setAuthCookie(true);
        setRoleCookie(role);
        set({
          user: { userId: response.userId, email: response.email, fullName: response.fullName },
          token: response.accessToken,
          isAuthenticated: true,
          role,
          permissions,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
        }
        setAuthCookie(false);
        setRoleCookie(null);
        set({ user: null, token: null, isAuthenticated: false, role: null, permissions: 0n });
      },

      updateFromToken: (token: string) => {
        const { role, permissions } = extractRoleAndPermissions(token);
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        setRoleCookie(role);
        set({ token, role, permissions });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        permissions: state.permissions.toString(),
      }),
      merge: (persisted, currentState) => {
        const persistedState = persisted as Record<string, unknown> | undefined;
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          permissions:
            typeof persistedState.permissions === "string"
              ? BigInt(persistedState.permissions)
              : 0n,
        };
      },
    }
  )
);
