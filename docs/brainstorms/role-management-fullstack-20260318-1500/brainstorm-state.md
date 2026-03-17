# Brainstorm State — Fullstack Role Management

## Topic
Dynamic role & permission management for GymManager. Owner-only access to manage which permissions each role has, and assign roles to users. Replace static frontend with DB-driven permissions.

## Mode
Default (full workflow)

## Discovery Answers
- **Requirements:** Fixed 5 roles (Owner, HouseManager, Trainer, Staff, Member). Owner toggles permissions per role per tenant. Seed defaults on tenant creation. Owner-only access. Also include user-role assignment.
- **Timeline:** This sprint (1-2 weeks)
- **Approach:** Relational model — separate tables for role-permission mappings. Replace bitmask storage.

## Current State
- No DB tables for roles/permissions — enum + bigint bitmask on User entity
- No admin endpoint for role/permission changes
- Static frontend route-access.ts
- PermissionsChangedEvent wired but never published
- TenantId hardcoded in CurrentUser
- RoleSeedData.cs has defaults but unused

## Raw Ideas (24)
1. RolePermission table: (TenantId, Role, Permission) — tenant-scoped permission config
2. UserRole table or column migration: store user's role relationally, linked to tenant
3. Seed default RolePermission rows per tenant on gym creation using existing RoleSeedData
4. Permission enum remains in code (source of truth for available permissions)
5. Role enum remains in code (fixed 5 roles, not user-creatable)
6. GET /api/v1/roles/permissions — list all roles with current permissions for tenant
7. PUT /api/v1/roles/{role}/permissions — bulk update permissions for a role
8. GET /api/v1/roles/{role}/users — list users with a given role
9. PUT /api/v1/users/{userId}/role — change a user's role
10. POST /api/v1/roles/reset-defaults — reset role permissions to seed defaults
11. Role management page at /settings/roles — grid of roles x permissions with toggles
12. User-role assignment page/section
13. Confirmation dialog for permission changes affecting many users
14. Real-time permission refresh via existing SignalR PermissionsChanged event
15. Replace static route-access.ts with dynamic route filtering from auth store
16. Owner-only middleware guard on all role management endpoints
17. Prevent Owner from removing their own Owner role
18. Prevent permission escalation — cannot grant permissions you don't have (Owner bypasses)
19. Database migration: add RolePermission table, migrate existing bitmask data
20. Backward-compatible: keep bitmask in JWT for fast runtime checks, compile from DB on token issue
21. "Reset to defaults" button per role
22. Permission grouping in UI (Members, Finance, Classes, Staff, Settings)
23. Role comparison view — side-by-side permission matrix
24. Bulk role reassignment for multiple users

## Confirmed Clusters (A-F)
- **A. Relational Data Model & Migration** (Ideas 1-5, 19, 20) — Core tables, seed data, migration
- **B. Role-Permission Management API** (Ideas 6-7, 10, 16-18) — CRUD endpoints, security
- **C. User-Role Assignment API** (Ideas 8-9) — Assign/change user roles
- **D. Management UI — Permission Toggles** (Ideas 11, 15, 22) — Owner permission management page
- **E. Management UI — User Assignment** (Ideas 12, 13, 24) — Owner user-role assignment
- **F. Real-time Sync & SignalR** (Idea 14) — Push permission updates to connected clients

## Research Instructions
- Analyze the existing codebase to determine exact migration steps from bitmask to relational
- Evaluate whether to keep bitmask in JWT (compiled from DB) or switch to array-of-strings
- Design the EF Core entity model and relationships
- Define API contracts following existing controller patterns
- Design frontend pages following existing page patterns (TanStack Query, Zustand)
- Address the TenantId hardcoding issue in CurrentUser
- Ensure PermissionsChangedEvent gets published when Owner changes permissions
