import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { buildPermissionFlag } from "@/lib/permissions";
import { PermissionSkeleton } from "@/components/permission-skeleton";

// Replicate commonly-used permission flags via buildPermissionFlag
const ViewMembers = buildPermissionFlag(0);
const ManageMembers = buildPermissionFlag(1);

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
      permissions: ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionSkeleton
        permission={ManageMembers}
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
      permissions: ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionSkeleton
        permission={ManageMembers}
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
      permissions: ViewMembers,
      role: "Member",
    });

    render(
      <PermissionSkeleton
        permission={ManageMembers}
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
      permissions: ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionSkeleton permission={ManageMembers}>
        <button>Add Member</button>
      </PermissionSkeleton>
    );

    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
    // Default skeleton renders an empty fragment
  });
});
