import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/settings/roles/users",
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
import UserRolesPage from "@/app/(dashboard)/settings/roles/users/page";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockHouseManagerUsers = {
  items: [
    {
      userId: "u1",
      email: "manager@gym.com",
      fullName: "House Manager One",
      role: "HouseManager",
      createdAt: "2026-01-15T10:00:00Z",
    },
    {
      userId: "u2",
      email: "manager2@gym.com",
      fullName: "House Manager Two",
      role: "HouseManager",
      createdAt: "2026-02-01T10:00:00Z",
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
};

const mockTrainerUsers = {
  items: [
    {
      userId: "u3",
      email: "trainer@gym.com",
      fullName: "Trainer One",
      role: "Trainer",
      createdAt: "2026-01-20T10:00:00Z",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("UserRolesPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockReplace.mockClear();
    useRbacStore.getState().setMetadata(testRolesMetadata);
  });

  afterEach(() => {
    useRbacStore.getState().reset();
  });

  it("redirects non-Owner users to /403", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "staff@gym.com", fullName: "Test Staff" },
      isAuthenticated: true,
      role: "Staff",
      permissions: 1n,
    });

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    expect(mockReplace).toHaveBeenCalledWith("/403");
  });

  it("renders the page title for Owner", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockHouseManagerUsers);

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    expect(screen.getByText("User Roles")).toBeInTheDocument();
  });

  it("renders role tabs", () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockHouseManagerUsers);

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    expect(screen.getByRole("tab", { name: "HouseManager" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Trainer" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Staff" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Member" })).toBeInTheDocument();
  });

  it("fetches and displays users for the active role tab", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockHouseManagerUsers);

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("House Manager One")).toBeInTheDocument();
    });
    expect(screen.getByText("House Manager Two")).toBeInTheDocument();
  });

  it("switches to Trainer tab and fetches trainer users", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockHouseManagerUsers) // initial HouseManager fetch
      .mockResolvedValueOnce(mockTrainerUsers); // after clicking Trainer tab

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("House Manager One")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Trainer" }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        "/roles/Trainer/users",
        expect.objectContaining({ params: { page: 1, pageSize: 20 } })
      );
    });
  });

  it("opens change role dialog when Change Role button is clicked", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockHouseManagerUsers);

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("House Manager One")).toBeInTheDocument();
    });

    const changeButtons = screen.getAllByRole("button", {
      name: /change role for house manager one/i,
    });
    expect(changeButtons.length).toBeGreaterThan(0);
    fireEvent.click(changeButtons[0]);

    expect(screen.getByText("Change User Role")).toBeInTheDocument();
    // The dialog description contains the user name
    const dialogTitle = screen.getByRole("heading", { name: "Change User Role" });
    expect(dialogTitle).toBeInTheDocument();
  });

  it("submits role change via PUT when Change Role dialog is confirmed", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue(mockHouseManagerUsers);
    vi.mocked(apiClient.put).mockResolvedValue(undefined);

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("House Manager One")).toBeInTheDocument();
    });

    // Open dialog
    const changeButtons = screen.getAllByRole("button", {
      name: /change role for house manager one/i,
    });
    fireEvent.click(changeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Change User Role")).toBeInTheDocument();
    });

    // Select a different role
    const select = screen.getByRole("combobox", { name: /select new role/i });
    fireEvent.change(select, { target: { value: "Trainer" } });

    // Click confirm
    const confirmButton = screen.getByRole("button", { name: /^change role$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith("/users/u1/role", { role: "Trainer" });
    });
  });

  it("shows pagination when totalCount exceeds pageSize", async () => {
    useAuthStore.setState({
      user: { userId: "u1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });
    vi.mocked(apiClient.get).mockResolvedValue({
      ...mockHouseManagerUsers,
      totalCount: 45,
      pageSize: 20,
    });

    render(<UserRolesPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText("House Manager One")).toBeInTheDocument();
    });

    // Pagination should be visible
    expect(screen.getByRole("button", { name: /next page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous page/i })).toBeInTheDocument();
  });
});
