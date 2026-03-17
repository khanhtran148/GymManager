import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { Permission } from "@/lib/permissions";
import { PermissionGate } from "@/components/permission-gate";

describe("PermissionGate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows children when user has the required permission", () => {
    useAuthStore.setState({
      permissions: Permission.ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionGate permission={Permission.ManageMembers}>
        <button>Add Member</button>
      </PermissionGate>
    );

    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("hides children when user lacks the required permission", () => {
    useAuthStore.setState({
      permissions: Permission.ViewMembers,
      role: "Member",
    });

    render(
      <PermissionGate permission={Permission.ManageMembers}>
        <button>Add Member</button>
      </PermissionGate>
    );

    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
  });

  it("shows fallback when provided and permission is absent", () => {
    useAuthStore.setState({
      permissions: Permission.ViewMembers,
      role: "Member",
    });

    render(
      <PermissionGate
        permission={Permission.ManageMembers}
        fallback={<span>No access</span>}
      >
        <button>Add Member</button>
      </PermissionGate>
    );

    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("shows children when user has Admin permission", () => {
    useAuthStore.setState({
      permissions: Permission.Admin,
      role: "Owner",
    });

    render(
      <PermissionGate permission={Permission.ManageStaff}>
        <button>Add Staff</button>
      </PermissionGate>
    );

    expect(screen.getByText("Add Staff")).toBeInTheDocument();
  });
});
