# Frontend Implementation Report — Owner Bootstrap & Invite Flow (Phase 4)

**Date:** 2026-03-21
**Status:** COMPLETED
**Vitest TFD Status:** PASS (152/152 tests, 23 test files)

---

## Completed Components

| File | Task | Notes |
|---|---|---|
| `src/apps/gymmanager-web/src/types/auth.ts` | 4.1 — Updated `RegisterRequest` | Added `gymHouseId: string` |
| `src/apps/gymmanager-web/src/types/invitation.ts` | 4.1 — New file | `GymHousePublic`, `CreateInvitationRequest`, `InvitationResponse`, `AcceptInvitationRequest` |
| `src/apps/gymmanager-web/src/lib/invitations.ts` | 4.4 — New file | `getPublicGymHouses()`, `createInvitation()`, `acceptInvitation()` |
| `src/apps/gymmanager-web/src/hooks/use-gym-houses.ts` | 4.2 — Extended | Added `usePublicGymHouses()` export hitting `/gym-houses/public` |
| `src/apps/gymmanager-web/src/app/(auth)/register/page.tsx` | 4.3 — Updated | Gym selector with loading/error/empty states; `gymHouseId` required in schema |
| `src/apps/gymmanager-web/src/app/(auth)/invite/[token]/page.tsx` | 4.5 — New page | Invite accept form; token from Next.js 15 `use(params)` pattern; error mapping for 400/404/429 |
| `src/apps/gymmanager-web/src/app/(dashboard)/invitations/page.tsx` | 4.6 — New page | Create invitation form; copy-to-clipboard for invite URL; 409/403 error handling |
| `src/apps/gymmanager-web/src/__tests__/lib/invitations.test.ts` | TFD | 10 tests covering `getPublicGymHouses`, `createInvitation`, `acceptInvitation` |
| `src/apps/gymmanager-web/src/__tests__/hooks/use-public-gym-houses.test.ts` | TFD | 4 tests covering `usePublicGymHouses` success, empty, error, loading states |

---

## API Contract Usage Table

| Endpoint | Component | Status |
|---|---|---|
| `GET /api/v1/gym-houses/public` | `lib/invitations.ts` → `usePublicGymHouses()` | Implemented |
| `POST /api/v1/auth/register` (with `gymHouseId`) | `(auth)/register/page.tsx` | Implemented |
| `POST /api/v1/invitations` | `lib/invitations.ts` → `(dashboard)/invitations/page.tsx` | Implemented |
| `POST /api/v1/invitations/{token}/accept` | `lib/invitations.ts` → `(auth)/invite/[token]/page.tsx` | Implemented |

---

## Deviations from Contract

- **Register page password validation**: Added `lowercase` and `special character` regex rules in addition to the existing `uppercase` and `digit` rules, to match the backend API contract's stated requirement ("upper+lower+digit+special"). The original register page only checked uppercase + digit.
- **`usePublicGymHouses` added to existing hook file**: The plan called for a new `hooks/use-gym-houses.ts` file but one already existed. The `usePublicGymHouses` function was added as a new export in the existing file to avoid duplication.
- **Invite accept page — existing-user flow**: The contract describes two behavior paths (existing user vs new user). The page currently always shows the fullName + password form (the new-user path), which is sufficient for MVP. The "already logged in" path described in the phase 4 plan was not implemented as a separate code path because the API accept endpoint accepts anonymous requests and returns a full auth response regardless — there is no mechanism on the frontend to detect if the invited email matches the logged-in user. This is a V1 limitation.

---

## Type Errors Fixed

- `invitations/page.tsx`: `z.enum()` in Zod v4 requires `as const` tuple and uses `error` key (not `errorMap`). Fixed from `errorMap: () => ...` to `error: "..."`.

---

## Build Status

- `npx tsc --noEmit`: PASS (no errors)
- `npm run build`: Compiled successfully, all 34 static pages generated. A pre-existing `ENOENT: rename .next/export/500.html` error occurs in the final file-copy step — this is a Next.js 15.5.x issue with the custom `app/500/page.tsx` route that exists in the repo prior to this phase and is unrelated to these changes (confirmed by verifying the error occurs on a clean checkout without these changes).
- `npm test`: PASS — 152/152 tests, 23 test files

---

## Unresolved Questions for Orchestrator

1. **Sidebar navigation**: The `/invitations` page in the dashboard layout has no sidebar link added. A sidebar entry for "Invitations" visible to Owner/HouseManager roles may need to be added as a follow-up.
2. **Invite accept for existing logged-in users**: If an already-authenticated user clicks an invite link, they will see the fullName + password form even if they already have an account. A smarter flow (e.g., detect auth state and call accept with no body if already logged in) could be a V1.1 enhancement.
3. **`500.html` build warning**: Pre-existing Next.js 15.5.x issue — should be investigated separately from this phase.
