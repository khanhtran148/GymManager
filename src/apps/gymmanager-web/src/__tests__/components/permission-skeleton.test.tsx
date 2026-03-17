import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { Permission } from "@/lib/permissions";
import { PermissionSkeleton } from "@/components/permission-skeleton";

// Mock useMounted to control mount state
let mockMounted = false;
vi.mock("@/hooks/use-mounted", () => ({
  useMounted: () => mockMounted,
}));

describe("PermissionSkeleton", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMounted = false;
  });

  it("shows skeleton before mount", () => {
    mockMounted = false;
    useAuthStore.setState({
      permissions: Permission.ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionSkeleton
        permission={Permission.ManageMembers}
        skeleton={<div data-testid="skeleton">Loading...</div>}
      >
        <button>Add Member</button>
      </PermissionSkeleton>
    );

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
  });

  it("shows gated content after mount when permission is present", () => {
    mockMounted = true;
    useAuthStore.setState({
      permissions: Permission.ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionSkeleton
        permission={Permission.ManageMembers}
        skeleton={<div data-testid="skeleton">Loading...</div>}
      >
        <button>Add Member</button>
      </PermissionSkeleton>
    );

    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("hides content after mount when permission is absent", () => {
    mockMounted = true;
    useAuthStore.setState({
      permissions: Permission.ViewMembers,
      role: "Member",
    });

    render(
      <PermissionSkeleton
        permission={Permission.ManageMembers}
        skeleton={<div data-testid="skeleton">Loading...</div>}
      >
        <button>Add Member</button>
      </PermissionSkeleton>
    );

    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
  });

  it("shows default empty skeleton when no skeleton prop provided", () => {
    mockMounted = false;
    useAuthStore.setState({
      permissions: Permission.ManageMembers,
      role: "Owner",
    });

    const { container } = render(
      <PermissionSkeleton permission={Permission.ManageMembers}>
        <button>Add Member</button>
      </PermissionSkeleton>
    );

    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
    // Default skeleton renders an empty fragment
  });
});
