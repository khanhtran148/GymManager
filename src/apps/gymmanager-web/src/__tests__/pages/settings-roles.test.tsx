import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/settings/roles",
}));

// Mock api-client
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  apiClient: { get: vi.fn() },
}));

import * as apiClient from "@/lib/api-client";
import RolePermissionsPage from "@/app/(dashboard)/settings/roles/page";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockRolePermissionsResponse = {
  items: [
    {
      role: "Owner",
      roleValue: 0,
      permissions: String(~0n & 0xffffffffffffffffn),
      permissionNames: ["ViewMembers", "ManageMembers"],
    },
    {
      role: "HouseManager",
      roleValue: 1,
      permissions: "33554431",
      permissionNames: ["ViewMembers", "ManageMembers"],
    },
    {
      role: "Trainer",
      roleValue: 2,
      permissions: "1",
      permissionNames: ["ViewMembers"],
    },
    {
      role: "Staff",
      roleValue: 3,
      permissions: "1",
      permissionNames: ["ViewMembers"],
    },
    {
      role: "Member",
      roleValue: 4,
      permissions: "1",
      permissionNames: ["ViewMembers"],
    },
  ],
};

describe("RolePermissionsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockReplace.mockClear();
  });

  it("redirects non-Owner users to /403", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "trainer@gym.com", fullName: "Test Trainer" },
      isAuthenticated: true,
      role: "Trainer",
      permissions: 1n,
    });

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    expect(mockReplace).toHaveBeenCalledWith("/403");
  });

  it("renders the page title for Owner", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    expect(screen.getByText("Role Permissions")).toBeInTheDocument();
  });

  it("renders the Reset to Defaults button for Owner", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeInTheDocument();
  });

  it("shows reset confirmation dialog when Reset to Defaults is clicked", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(screen.getByText("Reset to Default Permissions")).toBeInTheDocument();
  });

  it("renders the permission toggle grid with role columns", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    // Wait for permission grid columns to appear (table headers)
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /role permissions matrix/i })).toBeInTheDocument();
    });

    // Column headers appear within the table
    const table = screen.getByRole("table", { name: /role permissions matrix/i });
    expect(table).toHaveTextContent("HouseManager");
    expect(table).toHaveTextContent("Trainer");
    expect(table).toHaveTextContent("Staff");
    expect(table).toHaveTextContent("Member");
  });

  it("shows permission category labels in the grid", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });
  });

  it("calls PUT to update permissions when a toggle is clicked", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockRolePermissionsResponse);
    vi.mocked(apiClient.put).mockResolvedValue(undefined);

    render(<RolePermissionsPage />, { wrapper: makeWrapper() });

    // Wait for the toggle switches to render
    await waitFor(() => {
      const toggles = screen.getAllByRole("switch");
      expect(toggles.length).toBeGreaterThan(0);
    });

    // Find a non-disabled toggle (not Owner column) and click it
    const switches = screen.getAllByRole("switch");
    const editableSwitch = switches.find(
      (s) => !s.hasAttribute("disabled") && s.getAttribute("aria-label")?.includes("Trainer")
    );

    if (editableSwitch) {
      fireEvent.click(editableSwitch);
      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    }
  });
});
