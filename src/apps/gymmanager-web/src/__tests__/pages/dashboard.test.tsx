import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";

// Mock api-client to prevent real network calls
vi.mock("@/lib/api-client", () => ({
  get: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { items: [], totalCount: 0 } }),
  },
}));

// Import after mocks
import DashboardPage from "@/app/(dashboard)/page";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("DashboardPage role-conditional rendering", () => {
  beforeEach(() => {
    localStorage.clear();
    useRbacStore.getState().setMetadata(testRolesMetadata);
  });

  afterEach(() => {
    useRbacStore.getState().reset();
  });

  it("shows stats cards and system overview for Owner", () => {
    useAuthStore.setState({
      user: { userId: "1", email: "owner@gym.com", fullName: "Test Owner" },
      isAuthenticated: true,
      role: "Owner",
      permissions: ~0n,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("System Overview")).toBeInTheDocument();
    expect(screen.getByText("Add Gym House")).toBeInTheDocument();
    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("shows stats cards for Staff but shows system overview", () => {
    useAuthStore.setState({
      user: { userId: "2", email: "staff@gym.com", fullName: "Test Staff" },
      isAuthenticated: true,
      role: "Staff",
      permissions: (1n << 0n) | (1n << 8n) | (1n << 17n), // ViewMembers | ViewPayments | ViewFinance
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Total Members")).toBeInTheDocument();
    // Staff can see stats but not system overview (Owner/HouseManager only)
    expect(screen.queryByText("System Overview")).not.toBeInTheDocument();
  });

  it("hides Add Gym House for Member role (no ManageTenant permission)", () => {
    useAuthStore.setState({
      user: { userId: "3", email: "member@gym.com", fullName: "Test Member" },
      isAuthenticated: true,
      role: "Member",
      permissions: (1n << 0n) | (1n << 13n), // ViewMembers | ViewBookings
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.queryByText("Add Gym House")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
    // Members should not see stats or system overview
    expect(screen.queryByText("Total Members")).not.toBeInTheDocument();
    expect(screen.queryByText("System Overview")).not.toBeInTheDocument();
  });

  it("shows HouseManager the stats and system overview", () => {
    useAuthStore.setState({
      user: { userId: "4", email: "hm@gym.com", fullName: "House Manager" },
      isAuthenticated: true,
      role: "HouseManager",
      permissions: ~0n,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.getByText("System Overview")).toBeInTheDocument();
  });
});
