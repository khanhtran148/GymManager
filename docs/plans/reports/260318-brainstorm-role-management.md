# Brainstorm Report: Fullstack Role & Permission Management

**Date:** 2026-03-18
**ADR:** [260318-fullstack-role-permission-management](../../adrs/260318-fullstack-role-permission-management.md)
**Discovery Context:** [discovery-context.md](../../brainstorms/role-management-fullstack-20260318-1500/discovery-context.md)

## Problem

Role and permission management is static — hardcoded in frontend `route-access.ts` and baked into user records as bitmask flags at creation time. No mechanism for gym Owners to customize what each role can do. No admin UI for role assignment post-registration.

## Role Hierarchy (User-Defined)

- **Owner**: Full access across all houses. Manages roles, permissions, all resources.
- **HouseManager**: Full access to their gym house — manages staff, trainers, members.
- **Trainer**: Access to their assigned members.
- **Staff/Member**: Same basic level — self-service access.

## Approach Selected

Relational `role_permissions` table with tenant-scoped bitmask storage. Owner-only CQRS endpoints for permission management and user-role assignment. Management UI with permission toggle grid. Keep bitmask in JWT for O(1) runtime checks. Use existing SignalR wiring for real-time propagation.

## Decision Matrix Summary

| Decision | Winner | Score | Runner-up | Score |
|---|---|---|---|---|
| JWT format | Keep compiled bitmask | 4.45 | Array of strings | 3.60 |
| Storage model | Single table + bitmask column | 4.70 | One row per permission | 3.70 |
| Frontend source | Decode from JWT | 4.70 | Fetch from API | 3.30 |
| Migration strategy | Additive (keep old column) | 4.25 | Big-bang | 3.50 |

## Key Risks & Mitigations

1. **Seed data drift** — New permissions must be seeded to existing tenants via migration
2. **Owner lockout** — Owner hardcoded to full permissions, cannot be demoted
3. **Stale permissions** — 15-min token TTL fallback; backend always enforces
4. **Token issuance latency** — Cache role_permissions with 5-min TTL

## Scope

**In scope:** Data model, migration, seed defaults, 5 CQRS endpoints, 2 frontend pages, SignalR integration.
**Out of scope:** Custom roles, per-GymHouse overrides, audit log, instant token revocation.

## Timeline

8 working days, this sprint.
