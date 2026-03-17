import { post } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
} from "@/types/auth";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await post<AuthResponse>("/auth/login", data);
  storeTokens(response);
  return response;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await post<AuthResponse>("/auth/register", data);
  storeTokens(response);
  return response;
}

export async function refreshToken(data: RefreshRequest): Promise<AuthResponse> {
  const response = await post<AuthResponse>("/auth/refresh", data);
  storeTokens(response);
  return response;
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function storeTokens(response: AuthResponse): void {
  localStorage.setItem("access_token", response.accessToken);
  localStorage.setItem("refresh_token", response.refreshToken);
  localStorage.setItem(
    "user",
    JSON.stringify({ userId: response.userId, expiresAt: response.expiresAt })
  );
}
