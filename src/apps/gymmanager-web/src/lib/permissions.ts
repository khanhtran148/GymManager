/**
 * Permission bitwise constants mirroring backend Permission.cs exactly.
 * Uses BigInt to match the backend `Permission : long` enum.
 *
 * All frontend permission checks are UX-only.
 * The backend IPermissionChecker remains the security boundary.
 */
export const Permission = {
  None: 0n,

  // Members
  ViewMembers: 1n << 0n,
  ManageMembers: 1n << 1n,

  // Subscriptions
  ViewSubscriptions: 1n << 2n,
  ManageSubscriptions: 1n << 3n,

  // Classes
  ViewClasses: 1n << 4n,
  ManageClasses: 1n << 5n,

  // Trainers
  ViewTrainers: 1n << 6n,
  ManageTrainers: 1n << 7n,

  // Payments
  ViewPayments: 1n << 8n,
  ProcessPayments: 1n << 9n,

  // Tenants / Settings
  ManageTenant: 1n << 10n,

  // Reports
  ViewReports: 1n << 11n,

  // Bookings
  ManageBookings: 1n << 12n,
  ViewBookings: 1n << 13n,

  // Schedule
  ManageSchedule: 1n << 14n,
  ViewSchedule: 1n << 15n,

  // Finance
  ManageFinance: 1n << 16n,
  ViewFinance: 1n << 17n,

  // Staff
  ManageStaff: 1n << 18n,
  ViewStaff: 1n << 19n,

  // Announcements
  ManageAnnouncements: 1n << 20n,
  ViewAnnouncements: 1n << 21n,

  // Payroll
  ApprovePayroll: 1n << 22n,

  // Shifts
  ManageShifts: 1n << 23n,
  ViewShifts: 1n << 24n,

  // Waitlist
  ManageWaitlist: 1n << 25n,

  // Admin -- all bits set (same as backend ~0L)
  Admin: ~0n,
} as const;

export type PermissionFlag = (typeof Permission)[keyof typeof Permission];

/**
 * Check if a user has ALL of the required permission bits set.
 */
export function hasPermission(userPermissions: bigint, required: bigint): boolean {
  return (userPermissions & required) === required;
}

/**
 * Check if a user has ANY of the required permissions.
 */
export function hasAnyPermission(userPermissions: bigint, ...required: bigint[]): boolean {
  return required.some((p) => (userPermissions & p) === p);
}
