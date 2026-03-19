"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import { login as loginFn, register as registerFn, logout as logoutFn } from "@/lib/auth";
import { ROLES_METADATA_QUERY_KEY } from "@/hooks/use-roles-metadata";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  /**
   * Invalidates the roles-metadata query so the RbacProvider re-fetches
   * with the new user's permissions on their next dashboard visit.
   * Also resets the rbac-store so it shows a loading state until re-fetched.
   */
  function invalidateRbacCache(): void {
    // Remove the stale route_access cookie so middleware uses the static fallback
    // until the new cookie is written by RbacProvider after re-fetch.
    if (typeof document !== "undefined") {
      document.cookie = "route_access=; path=/; max-age=0; SameSite=Lax";
    }
    // Mark query as stale — RbacProvider's useRolesMetadata will refetch on next render
    queryClient.invalidateQueries({ queryKey: ROLES_METADATA_QUERY_KEY });
  }

  async function login(data: LoginRequest): Promise<void> {
    const response = await loginFn(data);
    storeLogin(response);
    invalidateRbacCache();
    router.push("/");
  }

  async function register(data: RegisterRequest): Promise<void> {
    const response = await registerFn(data);
    storeLogin(response);
    invalidateRbacCache();
    router.push("/");
  }

  function logout(): void {
    logoutFn();
    storeLogout();
    // Reset the RBAC store so it requires a fresh load on next login
    useRbacStore.getState().reset();
    invalidateRbacCache();
    router.push("/login");
  }

  return { user, token, isAuthenticated, login, register, logout };
}
