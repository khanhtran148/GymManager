import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth-store";
import { RoleGate } from "@/components/role-gate";

describe("RoleGate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows children for an allowed role", () => {
    useAuthStore.setState({ role: "Owner", permissions: 0n });

    render(
      <RoleGate roles={["Owner", "HouseManager"]}>
        <span>Admin content</span>
      </RoleGate>
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("hides children for a disallowed role", () => {
    useAuthStore.setState({ role: "Member", permissions: 0n });

    render(
      <RoleGate roles={["Owner", "HouseManager"]}>
        <span>Admin content</span>
      </RoleGate>
    );

    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("shows fallback when role is not allowed", () => {
    useAuthStore.setState({ role: "Trainer", permissions: 0n });

    render(
      <RoleGate
        roles={["Owner"]}
        fallback={<span>Not authorized</span>}
      >
        <span>Owner-only</span>
      </RoleGate>
    );

    expect(screen.queryByText("Owner-only")).not.toBeInTheDocument();
    expect(screen.getByText("Not authorized")).toBeInTheDocument();
  });

  it("hides children when role is null", () => {
    useAuthStore.setState({ role: null, permissions: 0n });

    render(
      <RoleGate roles={["Owner"]}>
        <span>Content</span>
      </RoleGate>
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });
});
