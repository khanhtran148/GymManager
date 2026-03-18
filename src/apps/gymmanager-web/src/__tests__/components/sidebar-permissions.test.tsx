import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { useRbacStore } from "@/stores/rbac-store";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { Sidebar } from "@/components/sidebar";

function setRole(role: string | null) {
  useAuthStore.setState({
    user: { userId: "u1", email: "test@test.com", fullName: "Test" },
    token: "fake-token",
    isAuthenticated: true,
    role: role as any,
    permissions: 0n,
  });
}

describe("Sidebar permissions filtering", () => {
  beforeEach(() => {
    localStorage.clear();
    useRbacStore.getState().setMetadata(testRolesMetadata);
  });

  afterEach(() => {
    useRbacStore.getState().reset();
  });

  it("Owner sees all nav entries including Finance and Staff & HR groups", () => {
    setRole("Owner");
    render(<Sidebar />);

    // "Dashboard" appears twice (top-level + Finance child), use getAllByText
    expect(screen.getAllByText("Dashboard")).toHaveLength(2);
    expect(screen.getByText("Gym Houses")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Class Schedules")).toBeInTheDocument();
    expect(screen.getByText("Time Slots")).toBeInTheDocument();
    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Staff & HR")).toBeInTheDocument();
    expect(screen.getByText("Announcements")).toBeInTheDocument();
  });

  it("Member does not see Gym Houses, Check-in, Finance, or Staff & HR", () => {
    setRole("Member");
    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Class Schedules")).toBeInTheDocument();
    expect(screen.getByText("Time Slots")).toBeInTheDocument();
    expect(screen.getByText("Announcements")).toBeInTheDocument();

    expect(screen.queryByText("Gym Houses")).not.toBeInTheDocument();
    expect(screen.queryByText("Check-in")).not.toBeInTheDocument();
    expect(screen.queryByText("Finance")).not.toBeInTheDocument();
    expect(screen.queryByText("Staff & HR")).not.toBeInTheDocument();
  });

  it("Staff sees Finance but not Staff & HR", () => {
    setRole("Staff");
    render(<Sidebar />);

    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.queryByText("Staff & HR")).not.toBeInTheDocument();
  });

  it("Staff does not see P&L Report in Finance group", () => {
    setRole("Staff");
    render(<Sidebar />);

    expect(screen.queryByText("P&L Report")).not.toBeInTheDocument();
  });

  it("HouseManager sees all entries including Staff & HR and P&L Report", () => {
    setRole("HouseManager");
    render(<Sidebar />);

    expect(screen.getByText("Staff & HR")).toBeInTheDocument();
    expect(screen.getByText("P&L Report")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });
});
