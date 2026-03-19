# Discovery Context — Fullstack Role Management

**Date:** 2026-03-18
**Topic:** Dynamic role & permission management owned by gym Owner

## Requirements
- Keep the existing 5 roles: Owner, HouseManager, Trainer, Staff, Member
- Owner can toggle which permissions each role has per tenant (gym)
- Seed default permission sets for each role on tenant creation
- Owner-only access to the role management UI and API endpoints
- Replace static frontend route-access.ts with DB-driven permission data

## Timeline
- This sprint (1-2 weeks)

## Approach
- Migrate from bitmask (long) to a relational model with separate Role/Permission tables
- Many-to-many relationship between roles and permissions
- Per-tenant role-permission mappings (different gyms can have different permission configs)

## Current State (from Scout)
- No DB tables for roles/permissions — stored as enum + bigint flags on User entity
- No admin endpoint to change roles/permissions after registration
- Static frontend route-access with hardcoded role mappings
- PermissionsChangedEvent wired (SignalR) but never published
- TenantId hardcoded in CurrentUser — multi-tenant scoping non-functional
- RoleSeedData.cs exists with default permission mappings but is never applied
