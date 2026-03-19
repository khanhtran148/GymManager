---
title: Post-Implementation Review
date: 2026-03-19
scope: git diff HEAD (48 files)
---

# Post-Implementation Review — 2026-03-19

## Summary
Reviewed 48 changed files from review-fix implementation. Found **1 CRITICAL**, **6 HIGH**, **3 MEDIUM**, **2 LOW** issues.

## CRITICAL (1)

| # | File | Title |
|---|------|-------|
| C1 | `appsettings.json` + `Program.cs` | JWT secret is now empty string — no startup validation prevents API from starting with zero-byte HMAC key |

## HIGH (6)

| # | File | Title |
|---|------|-------|
| H1 | `ApiControllerBase.cs:42-47` | Error prefix strings `[NOT_FOUND]`, `[FORBIDDEN]` leak in ProblemDetails `Detail` field |
| H2 | `PermissionChecker.cs:12-15` | Throws `InvalidOperationException` on userId mismatch — should return false + log instead |
| H3 | `ResetDefaultPermissionsCommandHandlerTests.cs` | Test regression: non-owner test still has `Permission.Admin` so `ManageRoles` check passes |
| H4 | `UpdateRolePermissionsCommandHandler.cs:27` | Bare string error `"Owner role permissions cannot be modified."` lacks `[CONFLICT]` prefix |
| H5 | `JwtTokenService.cs` | Empty secret `""` passes null-coalescing guard — needs minimum length check |
| H6 | `RefreshTokenCommandHandler.cs:22` | Exception filter `when (principal is null)` is always true — dead code, confusing |

## MEDIUM (3)

| # | File | Title |
|---|------|-------|
| M1 | `members/page.tsx:3` | `useRef` imported but unused after debounce rewrite |
| M2 | `ApiControllerBase.cs:50-56` | `ProblemDetails.Instance` exposes full request path with GUIDs |
| M3 | `RolePermissionDefaults.cs` | `ManageRoles` not in HouseManager defaults — intentional Owner-only lockout? |

## LOW (2)

| # | File | Title |
|---|------|-------|
| L1 | `GetBookingsQueryHandler.cs:23` | Null-forgiving `b.Member!` hides contract assumption |
| L2 | `PayrollApprovedConsumer.cs` | Batch save + per-item publish creates partial-publish risk |
