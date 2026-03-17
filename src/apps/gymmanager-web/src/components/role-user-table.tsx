"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { ChangeRoleDialog } from "@/components/change-role-dialog";
import { Role } from "@/lib/roles";
import { useRoleUsers, type RoleUserDto } from "@/hooks/use-role-users";

const ROLE_TABS = [
  Role.HouseManager,
  Role.Trainer,
  Role.Staff,
  Role.Member,
] as const;

type RoleTab = (typeof ROLE_TABS)[number];

const PAGE_SIZE = 20;

interface ToastState {
  message: string;
  variant: "success" | "error";
}

interface RoleUserTableProps {
  onToast?: (toast: ToastState) => void;
}

export function RoleUserTable({ onToast }: RoleUserTableProps) {
  const [activeRole, setActiveRole] = useState<RoleTab>(Role.HouseManager);
  const [page, setPage] = useState(1);
  const [dialogUser, setDialogUser] = useState<RoleUserDto | null>(null);

  const { data, isLoading, error } = useRoleUsers(activeRole, page, PAGE_SIZE);

  function handleRoleTabChange(role: RoleTab) {
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

  return (
    <div className="space-y-4">
      {/* Role tabs */}
      <div
        className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-fit"
        role="tablist"
        aria-label="Filter by role"
      >
        {ROLE_TABS.map((role) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={activeRole === role}
            aria-controls={`role-tab-panel-${role}`}
            id={`role-tab-${role}`}
            onClick={() => handleRoleTabChange(role)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeRole === role
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
        id={`role-tab-panel-${activeRole}`}
        role="tabpanel"
        aria-labelledby={`role-tab-${activeRole}`}
      >
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage={`No users with the ${activeRole} role found.`}
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
