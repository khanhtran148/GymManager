"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Permission } from "@/lib/permissions";
import { Role } from "@/lib/roles";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import {
  useRolePermissions,
  useUpdateRolePermissions,
  type RolePermissionDto,
} from "@/hooks/use-role-permissions";

// Permission categories with their flag names, mirroring Permission.cs groupings
interface PermissionCategory {
  label: string;
  permissions: Array<{ name: string; flag: bigint }>;
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    label: "Members",
    permissions: [
      { name: "ViewMembers", flag: Permission.ViewMembers },
      { name: "ManageMembers", flag: Permission.ManageMembers },
    ],
  },
  {
    label: "Subscriptions",
    permissions: [
      { name: "ViewSubscriptions", flag: Permission.ViewSubscriptions },
      { name: "ManageSubscriptions", flag: Permission.ManageSubscriptions },
    ],
  },
  {
    label: "Classes",
    permissions: [
      { name: "ViewClasses", flag: Permission.ViewClasses },
      { name: "ManageClasses", flag: Permission.ManageClasses },
    ],
  },
  {
    label: "Trainers",
    permissions: [
      { name: "ViewTrainers", flag: Permission.ViewTrainers },
      { name: "ManageTrainers", flag: Permission.ManageTrainers },
    ],
  },
  {
    label: "Payments",
    permissions: [
      { name: "ViewPayments", flag: Permission.ViewPayments },
      { name: "ProcessPayments", flag: Permission.ProcessPayments },
    ],
  },
  {
    label: "Settings",
    permissions: [{ name: "ManageTenant", flag: Permission.ManageTenant }],
  },
  {
    label: "Reports",
    permissions: [{ name: "ViewReports", flag: Permission.ViewReports }],
  },
  {
    label: "Bookings",
    permissions: [
      { name: "ManageBookings", flag: Permission.ManageBookings },
      { name: "ViewBookings", flag: Permission.ViewBookings },
    ],
  },
  {
    label: "Schedule",
    permissions: [
      { name: "ManageSchedule", flag: Permission.ManageSchedule },
      { name: "ViewSchedule", flag: Permission.ViewSchedule },
    ],
  },
  {
    label: "Finance",
    permissions: [
      { name: "ManageFinance", flag: Permission.ManageFinance },
      { name: "ViewFinance", flag: Permission.ViewFinance },
    ],
  },
  {
    label: "Staff",
    permissions: [
      { name: "ManageStaff", flag: Permission.ManageStaff },
      { name: "ViewStaff", flag: Permission.ViewStaff },
    ],
  },
  {
    label: "Announcements",
    permissions: [
      { name: "ManageAnnouncements", flag: Permission.ManageAnnouncements },
      { name: "ViewAnnouncements", flag: Permission.ViewAnnouncements },
    ],
  },
  {
    label: "Payroll",
    permissions: [{ name: "ApprovePayroll", flag: Permission.ApprovePayroll }],
  },
  {
    label: "Shifts",
    permissions: [
      { name: "ManageShifts", flag: Permission.ManageShifts },
      { name: "ViewShifts", flag: Permission.ViewShifts },
    ],
  },
  {
    label: "Waitlist",
    permissions: [{ name: "ManageWaitlist", flag: Permission.ManageWaitlist }],
  },
];

// Roles shown in columns (Owner always has all, shown as disabled)
const DISPLAY_ROLES = [
  Role.Owner,
  Role.HouseManager,
  Role.Trainer,
  Role.Staff,
  Role.Member,
] as const;

interface PermissionToggleProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  isPending?: boolean;
}

function PermissionToggle({
  checked,
  disabled,
  label,
  onChange,
  isPending,
}: PermissionToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || isPending}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-primary-500"
          : "bg-surface-300 dark:bg-surface-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function formatPermissionLabel(name: string): string {
  // "ManageMembers" -> "Manage Members"
  return name.replace(/([A-Z])/g, " $1").trim();
}

interface PermissionToggleGridProps {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function PermissionToggleGrid({ onError, onSuccess }: PermissionToggleGridProps) {
  const { data, isLoading, error } = useRolePermissions();
  const updateMutation = useUpdateRolePermissions();

  // Track which (role, permissionName) cells are currently saving
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  const getRoleBitmask = useCallback(
    (roleName: string, roleData: RolePermissionDto[]): bigint => {
      const entry = roleData.find((r) => r.role === roleName);
      if (!entry) return 0n;
      try {
        return BigInt(entry.permissions);
      } catch {
        return 0n;
      }
    },
    []
  );

  const hasFlag = useCallback((bitmask: bigint, flag: bigint): boolean => {
    return (bitmask & flag) === flag;
  }, []);

  const handleToggle = useCallback(
    (roleName: string, permName: string, permFlag: bigint, currentBitmask: bigint, newValue: boolean) => {
      const cellKey = `${roleName}:${permName}`;
      const newBitmask = newValue
        ? currentBitmask | permFlag
        : currentBitmask & ~permFlag;

      setPendingCells((prev) => new Set([...prev, cellKey]));

      updateMutation.mutate(
        { role: roleName, permissions: newBitmask.toString() },
        {
          onSuccess: () => {
            onSuccess?.(`Updated ${roleName} permissions`);
          },
          onError: () => {
            onError?.(`Failed to update ${roleName} permissions`);
          },
          onSettled: () => {
            setPendingCells((prev) => {
              const next = new Set(prev);
              next.delete(cellKey);
              return next;
            });
          },
        }
      );
    },
    [updateMutation, onSuccess, onError]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading permissions..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load role permissions. Please refresh the page.
      </Alert>
    );
  }

  const roleData = data?.items ?? [];

  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-sm bg-card">
      <table className="min-w-full" aria-label="Role permissions matrix">
        <thead>
          <tr className="bg-table-header border-b border-border">
            <th
              scope="col"
              className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-40"
            >
              Permission
            </th>
            {DISPLAY_ROLES.map((role) => (
              <th
                key={role}
                scope="col"
                className="px-4 py-3.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider"
              >
                <span className={cn(role === Role.Owner && "text-primary-600 dark:text-primary-400")}>
                  {role}
                </span>
                {role === Role.Owner && (
                  <span className="block text-[10px] font-normal text-text-muted normal-case tracking-normal">
                    (always on)
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        {PERMISSION_CATEGORIES.map((category) => (
          <tbody key={category.label}>
            {/* Category header row */}
            <tr className="bg-surface-50 dark:bg-surface-800/50 border-t border-border-muted">
              <td
                colSpan={DISPLAY_ROLES.length + 1}
                className="px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {category.label}
              </td>
            </tr>
            {/* Permission rows */}
            {category.permissions.map((perm) => (
              <tr
                key={perm.name}
                className="border-t border-table-divider hover:bg-table-row-hover transition-colors"
              >
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {formatPermissionLabel(perm.name)}
                </td>
                {DISPLAY_ROLES.map((role) => {
                  const isOwner = role === Role.Owner;
                  const bitmask = getRoleBitmask(role, roleData);
                  const checked = isOwner || hasFlag(bitmask, perm.flag);
                  const cellKey = `${role}:${perm.name}`;
                  const isPending = pendingCells.has(cellKey);

                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      {isPending ? (
                        <div className="flex items-center justify-center">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <PermissionToggle
                            checked={checked}
                            disabled={isOwner}
                            label={`${role}: ${formatPermissionLabel(perm.name)}`}
                            onChange={(newValue) =>
                              handleToggle(role, perm.name, perm.flag, bitmask, newValue)
                            }
                            isPending={isPending}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
