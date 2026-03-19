import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";

// Track SignalR event handlers
const eventHandlers = new Map<string, (...args: unknown[]) => void>();
const mockConnection = {
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    eventHandlers.set(event, handler);
  }),
  off: vi.fn((event: string) => {
    eventHandlers.delete(event);
  }),
};

vi.mock("@/lib/signalr", () => ({
  getNotificationConnection: () => mockConnection,
  startNotificationConnection: vi.fn().mockResolvedValue(undefined),
}));

// Mock api-client for token refresh
const mockPost = vi.fn();
vi.mock("@/lib/api-client", () => ({
  post: (...args: unknown[]) => mockPost(...args),
  get: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

// Must import after mocks
import { usePermissionSync } from "@/hooks/use-permission-sync";

describe("usePermissionSync", () => {
  beforeEach(() => {
    localStorage.clear();
    eventHandlers.clear();
    mockConnection.on.mockClear();
    mockConnection.off.mockClear();
    mockPost.mockReset();
    useAuthStore.setState({
      user: { userId: "user-1", email: "test@gym.com", fullName: "Test" },
      isAuthenticated: true,
      role: "Member",
      permissions: 1n,
      token: "old-token",
    });
  });

  it("registers PermissionsChanged handler on SignalR connection", () => {
    renderHook(() => usePermissionSync());

    expect(mockConnection.on).toHaveBeenCalledWith(
      "PermissionsChanged",
      expect.any(Function)
    );
  });

  it("unregisters handler on unmount", () => {
    const { unmount } = renderHook(() => usePermissionSync());
    unmount();

    expect(mockConnection.off).toHaveBeenCalledWith(
      "PermissionsChanged",
      expect.any(Function)
    );
  });

  it("triggers token refresh on PermissionsChanged event", async () => {
    localStorage.setItem("access_token", "old-access-token");
    localStorage.setItem("refresh_token", "old-refresh-token");

    mockPost.mockResolvedValue({
      userId: "user-1",
      email: "test@gym.com",
      fullName: "Test",
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresAt: new Date().toISOString(),
    });

    const updateSpy = vi.fn();
    useAuthStore.setState({ updateFromToken: updateSpy });

    renderHook(() => usePermissionSync());

    const handler = eventHandlers.get("PermissionsChanged");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!({ userId: "user-1", newRole: "HouseManager", newPermissions: "67108863" });
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/refresh", expect.any(Object));
  });

  it("updates auth store after successful token refresh", async () => {
    localStorage.setItem("access_token", "old-access-token");
    localStorage.setItem("refresh_token", "old-refresh-token");

    mockPost.mockResolvedValue({
      userId: "user-1",
      email: "test@gym.com",
      fullName: "Test",
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresAt: new Date().toISOString(),
    });

    const updateSpy = vi.fn();
    useAuthStore.setState({ updateFromToken: updateSpy });

    renderHook(() => usePermissionSync());

    const handler = eventHandlers.get("PermissionsChanged");

    await act(async () => {
      handler!({ userId: "user-1", newRole: "HouseManager", newPermissions: "67108863" });
    });

    expect(updateSpy).toHaveBeenCalledWith("new-access-token");
  });
});
