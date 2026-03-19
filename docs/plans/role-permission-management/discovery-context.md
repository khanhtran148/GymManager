# Discovery Context — Role Permission Management Plan

**Date:** 2026-03-18
**Source:** Brainstorm context + ADR 260318-fullstack-role-permission-management

## Requirements
- Fixed 5 roles (Owner, HouseManager, Trainer, Staff, Member) with editable permissions
- Owner-only access to role/permission management
- Seed default permissions per role per tenant
- Replace static frontend route-access.ts with DB-driven permission data
- Include user-role assignment

## Role Hierarchy
- Owner: full access, manages all houses, cannot be demoted
- HouseManager: full access to their house — manages staff, trainers, members
- Trainer: access to assigned members
- Staff/Member: same basic level

## Scope
Fullstack — Frontend + Backend + API

## Success Criteria
1. Owner can toggle permissions per role via UI
2. Owner can assign/change user roles via UI
3. Real-time permission sync works (SignalR → token refresh)

## Approach
- Relational `role_permissions` table with tenant-scoped bitmask
- Keep bitmask in JWT (no frontend migration)
- Owner-only CQRS API (5 endpoints)
- Management UI (permission toggles + user-role assignment)
- SignalR for real-time propagation via existing PermissionsChangedEvent

## ADR Reference
docs/adrs/260318-fullstack-role-permission-management.md
