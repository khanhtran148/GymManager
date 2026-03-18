"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRbacStore } from "@/stores/rbac-store";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import {
  useRolePermissions,
  useUpdateRolePermissions,
} from "@/hooks/use-role-permissions";

// Roles shown in the column header — Owner always has all and is shown as disabled
const OWNER_ROLE = "Owner";

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
  const { permissionCategories, permissionMap, roles: rbacRoles, isLoaded } = useRbacStore();

  // Track which (role, permissionName) cells are currently saving
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  // Derive display roles from store (all roles, Owner first)
  const displayRoles = useMemo(() => {
    if (!isLoaded || rbacRoles.length === 0) return [];
    const owner = rbacRoles.find((r) => r.name === OWNER_ROLE);
    const others = rbacRoles.filter((r) => r.name !== OWNER_ROLE);
    return owner ? [owner, ...others] : others;
  }, [rbacRoles, isLoaded]);

  const roleItems = data?.items ?? [];

  // Pre-index roleItems by role name → bigint bitmask so every render cell
  // is O(1) instead of O(n) Array.find
  const roleBitmaskIndex = useMemo<Record<string, bigint>>(() => {
    return roleItems.reduce<Record<string, bigint>>((acc, entry) => {
      try {
        acc[entry.role] = BigInt(entry.permissions);
      } catch {
        acc[entry.role] = 0n;
      }
      return acc;
    }, {});
  }, [roleItems]);

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

  if (isLoading || !isLoaded) {
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
            {displayRoles.map((roleObj) => (
              <th
                key={roleObj.name}
                scope="col"
                className="px-4 py-3.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider"
              >
                <span className={cn(roleObj.name === OWNER_ROLE && "text-primary-600 dark:text-primary-400")}>
                  {roleObj.name}
                </span>
                {roleObj.name === OWNER_ROLE && (
                  <span className="block text-[10px] font-normal text-text-muted normal-case tracking-normal">
                    (always on)
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        {permissionCategories.map((category) => (
          <tbody key={category.category}>
            {/* Category header row */}
            <tr className="bg-surface-50 dark:bg-surface-800/50 border-t border-border-muted">
              <td
                colSpan={displayRoles.length + 1}
                className="px-4 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {category.category}
              </td>
            </tr>
            {/* Permission rows */}
            {category.permissions.map((perm) => {
              // Use the store's pre-computed permissionMap for O(1) flag lookup
              const permFlag = permissionMap[perm.name] ?? (1n << BigInt(perm.bitPosition));
              return (
                <tr
                  key={perm.name}
                  className="border-t border-table-divider hover:bg-table-row-hover transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatPermissionLabel(perm.name)}
                  </td>
                  {displayRoles.map((roleObj) => {
                    const isOwner = roleObj.name === OWNER_ROLE;
                    // O(1) lookup via pre-indexed map
                    const bitmask = roleBitmaskIndex[roleObj.name] ?? 0n;
                    const checked = isOwner || hasFlag(bitmask, permFlag);
                    const cellKey = `${roleObj.name}:${perm.name}`;
                    const isPending = pendingCells.has(cellKey);

                    return (
                      <td key={roleObj.name} className="px-4 py-3 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center">
                            <Spinner size="sm" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <PermissionToggle
                              checked={checked}
                              disabled={isOwner}
                              label={`${roleObj.name}: ${formatPermissionLabel(perm.name)}`}
                              onChange={(newValue) =>
                                handleToggle(roleObj.name, perm.name, permFlag, bitmask, newValue)
                              }
                              isPending={isPending}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
