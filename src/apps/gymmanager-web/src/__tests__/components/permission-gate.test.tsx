import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { buildPermissionFlag } from "@/lib/permissions";
import { PermissionGate } from "@/components/permission-gate";

// Replicate commonly-used permission flags via buildPermissionFlag
const ViewMembers = buildPermissionFlag(0);
const ManageMembers = buildPermissionFlag(1);
const ManageStaff = buildPermissionFlag(18);
const Admin = ~0n;

describe("PermissionGate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows children when user has the required permission", () => {
    useAuthStore.setState({
      permissions: ManageMembers,
      role: "Owner",
    });

    render(
      <PermissionGate permission={ManageMembers}>
        <button>Add Member</button>
      </PermissionGate>
    );

    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("hides children when user lacks the required permission", () => {
    useAuthStore.setState({
      permissions: ViewMembers,
      role: "Member",
    });

    render(
      <PermissionGate permission={ManageMembers}>
        <button>Add Member</button>
      </PermissionGate>
    );

    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();
  });

  it("shows fallback when provided and permission is absent", () => {
    useAuthStore.setState({
      permissions: ViewMembers,
      role: "Member",
    });

    render(
      <PermissionGate
        permission={ManageMembers}
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
      permissions: Admin,
      role: "Owner",
    });

    render(
      <PermissionGate permission={ManageStaff}>
        <button>Add Staff</button>
      </PermissionGate>
    );

    expect(screen.getByText("Add Staff")).toBeInTheDocument();
  });
});
