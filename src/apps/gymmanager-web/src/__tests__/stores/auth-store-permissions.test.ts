import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

// Helper to create a minimal unsigned JWT with given payload
function makeUnsignedJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
}

// Mock document.cookie
let cookieStore: Record<string, string> = {};
Object.defineProperty(document, "cookie", {
  get: () =>
    Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  set: (value: string) => {
    const [nameValue] = value.split(";");
    const [name, val] = nameValue.split("=");
    if (val === "" || value.includes("max-age=0")) {
      delete cookieStore[name.trim()];
    } else {
      cookieStore[name.trim()] = val?.trim() ?? "";
    }
  },
  configurable: true,
});

describe("auth-store permissions", () => {
  beforeEach(() => {
    cookieStore = {};
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
      permissions: 0n,
    });
  });

  it("login() sets role and permissions from JWT", () => {
    const token = makeUnsignedJwt({
      sub: "user-1",
      role: "Owner",
      permissions: "67108863",
    });

    useAuthStore.getState().login({
      userId: "user-1",
      email: "owner@test.com",
      fullName: "Test Owner",
      accessToken: token,
      refreshToken: "refresh-token",
      expiresAt: "2026-12-31T00:00:00Z",
    });

    const state = useAuthStore.getState();
    expect(state.role).toBe("Owner");
    expect(state.permissions).toBe(67108863n);
    expect(state.isAuthenticated).toBe(true);
  });

  it("login() sets user_role cookie", () => {
    const token = makeUnsignedJwt({
      sub: "user-1",
      role: "HouseManager",
      permissions: "100",
    });

    useAuthStore.getState().login({
      userId: "user-1",
      email: "hm@test.com",
      fullName: "House Manager",
      accessToken: token,
      refreshToken: "refresh-token",
      expiresAt: "2026-12-31T00:00:00Z",
    });

    expect(cookieStore["user_role"]).toBe("HouseManager");
  });

  it("updateFromToken() updates role and permissions", () => {
    const initialToken = makeUnsignedJwt({
      sub: "user-1",
      role: "Member",
      permissions: "1",
    });

    useAuthStore.getState().login({
      userId: "user-1",
      email: "member@test.com",
      fullName: "Test Member",
      accessToken: initialToken,
      refreshToken: "refresh-token",
      expiresAt: "2026-12-31T00:00:00Z",
    });

    expect(useAuthStore.getState().role).toBe("Member");

    const newToken = makeUnsignedJwt({
      sub: "user-1",
      role: "HouseManager",
      permissions: "16777215",
    });

    useAuthStore.getState().updateFromToken(newToken);

    const state = useAuthStore.getState();
    expect(state.role).toBe("HouseManager");
    expect(state.permissions).toBe(16777215n);
    expect(state.token).toBe(newToken);
    expect(cookieStore["user_role"]).toBe("HouseManager");
  });

  it("logout() clears role, permissions, and user_role cookie", () => {
    const token = makeUnsignedJwt({
      sub: "user-1",
      role: "Owner",
      permissions: "67108863",
    });

    useAuthStore.getState().login({
      userId: "user-1",
      email: "owner@test.com",
      fullName: "Test Owner",
      accessToken: token,
      refreshToken: "refresh-token",
      expiresAt: "2026-12-31T00:00:00Z",
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.role).toBeNull();
    expect(state.permissions).toBe(0n);
    expect(cookieStore["user_role"]).toBeUndefined();
  });

  it("BigInt survives persist serialization round-trip", () => {
    const token = makeUnsignedJwt({
      sub: "user-1",
      role: "Owner",
      permissions: "67108863",
    });

    useAuthStore.getState().login({
      userId: "user-1",
      email: "owner@test.com",
      fullName: "Test Owner",
      accessToken: token,
      refreshToken: "refresh-token",
      expiresAt: "2026-12-31T00:00:00Z",
    });

    const stored = localStorage.getItem("auth-storage");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(typeof parsed.state.permissions).toBe("string");
    expect(parsed.state.permissions).toBe("67108863");
  });
});
