# Code Review Report: Frontend RBAC Permission System

**Date**: 2026-03-18
**Scope**: git diff e13570c..c816fad (53 files, 3007 insertions)
**Reviewers**: Security, Quality, Performance, TFD (4 parallel concern agents)

## Summary

The RBAC implementation is well-structured with correct BigInt bitwise operations, proper Zustand patterns, and clean component APIs. 14 issues found across 4 concerns; all critical/high and medium issues have been fixed.

## Issues Found and Fixed

### Critical/High (4 fixed)

| # | Issue | Fix Applied |
|---|---|---|
| 1 | `is_authenticated` and `user_role` cookies missing `Secure` flag | Added `; Secure` to both cookie strings in auth-store.ts |
| 2 | SignalR handler ignores `userId` — cross-user event confusion | Added userId validation guard in use-permission-sync.ts |
| 3 | Silent catch in usePermissionSync swallows all errors | Added dev-mode console.warn for debugging |
| 4 | Unsafe `as string` casts in jwt.ts — no runtime validation | Added `typeof` guards; returns null if claims missing |

### Medium (5 fixed)

| # | Issue | Fix Applied |
|---|---|---|
| 5 | Role arrays duplicated between sidebar.tsx and route-access.ts | Sidebar now derives roles from `getAllowedRolesForRoute()` |
| 6 | `canAccessRoute` accepts any string without validation | Added `VALID_ROLES` Set check — rejects unknown roles |
| 7 | PermissionGate/RoleGate missing React.memo | Wrapped both with `memo()` |
| 8 | JWT tests expected missing claims to return non-null | Updated tests to match safer null-return behavior |
| 9 | `_payload` unused in SignalR handler | Now used for userId validation |

### Acknowledged (not fixed — acceptable by design)

| # | Issue | Why Acceptable |
|---|---|---|
| 10 | Middleware auth gate driven by JS-writable cookie | Design decision: frontend checks are UX-only. Backend IPermissionChecker enforces security. A user forging cookies sees admin UI but all API calls return 403. |
| 11 | JWT tokens in localStorage (XSS exposure) | Pre-existing pattern. HttpOnly cookies require server-side auth flow redesign — out of scope. |
| 12 | `jose` imported for decode-only (bundle size) | 50kB min+gz is acceptable. Inline base64 decoder would lose error handling and type safety. |
| 13 | O(14) route scan in middleware | 14 entries is negligible for Edge Runtime. Pre-building a Map is premature optimization. |
| 14 | TFD not evidenced in git history | Single-commit delivery. Tests exist and pass (85 frontend + 198 backend). |

## Test Results After Fixes
- Frontend: **15 test files, 85 tests — ALL PASSING**
- Next.js build: **Successful** (30 routes, 34.3 kB middleware)
