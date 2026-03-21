# Brainstorm Report: Owner Bootstrap & Invite Flow

**Date:** 2026-03-21
**ADR:** docs/adrs/260321-owner-bootstrap-and-invite-flow.md
**Artifacts:** docs/brainstorms/owner-bootstrap-invite-flow-20260321-1000/

## Summary

Brainstormed how to create the first owner account on fresh deployment, given that registration is for members only. Discovered the current `RegisterCommandHandler` incorrectly creates owners and that `CurrentUser.TenantId` has a data isolation bug for non-owners.

## Decisions Made

1. **Startup seed via IHostedService** (scored 4.65/5) — env vars, idempotent, fail-fast
2. **Inline register refactor** (scored 5.00/5) — `RegisterCommand` adds `GymHouseId`, creates `Role.Member`
3. **Cryptographic random invite tokens** (scored 8.60/10) — 32-byte, URL-safe, DB-backed
4. **Embed tenant_id in JWT** (scored 8.60/10) — fixes `CurrentUser.TenantId` bug, no runtime DB lookup
5. **Check-existing-then-link for invite acceptance** (scored 7.95/10) — supports multi-gym

## Implementation Order

1. OwnerSeedService (~80 lines)
2. Register refactor + JWT tenant_id fix (~100 lines changed)
3. Invite link system (~300 lines new)
4. Test infrastructure (~150 lines)

## Critical Bug Found

`CurrentUser.TenantId` (line 23 of `CurrentUser.cs`) returns `UserId` for all users. For non-owner users, this means RLS filters by the wrong tenant — a data isolation vulnerability. Fixed by embedding `tenant_id` as a JWT claim.

## Open Items for Implementation

- `GET /api/v1/gym-houses/public` endpoint (for member registration to pick a gym)
- Email notification for invites (V2, via domain event)
- Multi-gym switching endpoint (deferred, needs `POST /api/v1/auth/switch-tenant`)
- Password validation in seed service (must match RegisterCommandValidator rules)
