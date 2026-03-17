"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { login as loginFn, register as registerFn, logout as logoutFn } from "@/lib/auth";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  async function login(data: LoginRequest): Promise<void> {
    const response = await loginFn(data);
    storeLogin(response);
    router.push("/");
  }

  async function register(data: RegisterRequest): Promise<void> {
    const response = await registerFn(data);
    storeLogin(response);
    router.push("/");
  }

  function logout(): void {
    logoutFn();
    storeLogout();
    router.push("/login");
  }

  return { user, token, isAuthenticated, login, register, logout };
}
