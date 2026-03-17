/**
 * Role constants mirroring backend Role.cs exactly.
 */
export const Role = {
  Owner: "Owner",
  HouseManager: "HouseManager",
  Trainer: "Trainer",
  Staff: "Staff",
  Member: "Member",
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];
