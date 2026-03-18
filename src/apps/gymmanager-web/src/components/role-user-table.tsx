"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { ChangeRoleDialog } from "@/components/change-role-dialog";
import { useRbacStore } from "@/stores/rbac-store";
import { useRoleUsers, type RoleUserDto } from "@/hooks/use-role-users";
import type { RoleType } from "@/lib/roles";

const PAGE_SIZE = 20;

interface ToastState {
  message: string;
  variant: "success" | "error";
}

interface RoleUserTableProps {
  onToast?: (toast: ToastState) => void;
}

export function RoleUserTable({ onToast }: RoleUserTableProps) {
  const { assignableRoles, isLoaded } = useRbacStore();

  // Derive role tabs from assignable roles (excludes Owner which is not assignable)
  const roleTabs: RoleType[] = useMemo(
    () => assignableRoles.map((r) => r.name),
    [assignableRoles]
  );

  const [activeRole, setActiveRole] = useState<RoleType>("");
  const [page, setPage] = useState(1);
  const [dialogUser, setDialogUser] = useState<RoleUserDto | null>(null);

  // Set default active role once store is loaded
  const effectiveRole = activeRole || roleTabs[0] || "";

  const { data, isLoading, error } = useRoleUsers(effectiveRole, page, PAGE_SIZE);

  function handleRoleTabChange(role: RoleType) {
    setActiveRole(role);
    setPage(1);
  }

  const columns = [
    {
      key: "fullName",
      header: "Name",
      render: (u: RoleUserDto) => (
        <span className="font-medium text-text-primary">{u.fullName}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u: RoleUserDto) => (
        <span className="text-text-muted text-xs">{u.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u: RoleUserDto) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
          )}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (u: RoleUserDto) => (
        <span className="text-text-muted text-xs tabular-nums">
          {new Date(u.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: RoleUserDto) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDialogUser(u)}
          aria-label={`Change role for ${u.fullName}`}
        >
          Change Role
        </Button>
      ),
    },
  ];

  if (!isLoaded || roleTabs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-card rounded-xl animate-pulse w-64" aria-hidden="true" />
        <div className="h-32 bg-card rounded-xl animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role tabs */}
      <div
        className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-fit"
        role="tablist"
        aria-label="Filter by role"
      >
        {roleTabs.map((role) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={effectiveRole === role}
            aria-controls={`role-tab-panel-${role}`}
            id={`role-tab-${role}`}
            onClick={() => handleRoleTabChange(role)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              effectiveRole === role
                ? "bg-primary-500 text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-hover"
            )}
          >
            {role}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="error">
          Failed to load users. Please try again.
        </Alert>
      )}

      <div
        id={`role-tab-panel-${effectiveRole}`}
        role="tabpanel"
        aria-labelledby={`role-tab-${effectiveRole}`}
      >
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage={`No users with the ${effectiveRole} role found.`}
          pagination={
            data
              ? {
                  page: data.page,
                  pageSize: data.pageSize,
                  totalCount: data.totalCount,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </div>

      <ChangeRoleDialog
        user={dialogUser}
        isOpen={dialogUser !== null}
        onClose={() => setDialogUser(null)}
        onSuccess={(msg) => onToast?.({ message: msg, variant: "success" })}
        onError={(msg) => onToast?.({ message: msg, variant: "error" })}
      />
    </div>
  );
}
