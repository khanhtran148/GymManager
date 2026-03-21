# Phase 4: Frontend (Next.js)
<!-- PARALLEL: runs simultaneously with Phase 3 (Invite System) and Phase 5 (Mobile) -->

## Purpose
Update registration form to include gym selection. Add invite accept page.

## FILE OWNERSHIP
Owns:
- `src/apps/gymmanager-web/src/app/(auth)/register/page.tsx`
- `src/apps/gymmanager-web/src/app/(auth)/invite/[token]/page.tsx` (new)
- `src/apps/gymmanager-web/src/types/auth.ts`
- `src/apps/gymmanager-web/src/lib/auth.ts`
- `src/apps/gymmanager-web/src/types/invitation.ts` (new)
- `src/apps/gymmanager-web/src/lib/invitations.ts` (new)
- `src/apps/gymmanager-web/src/hooks/use-gym-houses.ts` (new)

Must not touch: any `src/core/`, `src/apps/GymManager.Api/`, `tests/` backend files

## Implementation Steps

### 4.1 Update TypeScript types [S]
**File:** `src/apps/gymmanager-web/src/types/auth.ts`

Add `gymHouseId: string` to `RegisterRequest`.

**File:** `src/apps/gymmanager-web/src/types/invitation.ts` (new)

Add types from API contract: `GymHousePublic`, `CreateInvitationRequest`, `InvitationResponse`, `AcceptInvitationRequest`.

### 4.2 Add gym houses API hook [S]
**File:** `src/apps/gymmanager-web/src/hooks/use-gym-houses.ts` (new)

TanStack Query hook to fetch `GET /gym-houses/public`. Returns `{ data, isLoading, error }`.

### 4.3 Update register page [M]
**File:** `src/apps/gymmanager-web/src/app/(auth)/register/page.tsx`

Changes:
1. Add `gymHouseId` to zod schema (required UUID string)
2. Fetch gym houses via `useGymHouses` hook
3. Add a select/dropdown for gym selection
4. Pass `gymHouseId` in register call
5. Handle loading state while gyms load
6. Show error if no gyms available

### 4.4 Add invite API functions [S]
**File:** `src/apps/gymmanager-web/src/lib/invitations.ts` (new)

```typescript
export async function acceptInvitation(token: string, data: AcceptInvitationRequest): Promise<AuthResponse>
```

### 4.5 Create invite accept page [M]
**File:** `src/apps/gymmanager-web/src/app/(auth)/invite/[token]/page.tsx` (new)

Page at `/invite/{token}`:
1. Extract `token` from route params
2. Show form with password + fullName fields (same validation as register)
3. On submit, call `POST /invitations/{token}/accept`
4. On success, store tokens and redirect to dashboard
5. Handle errors: expired, already accepted, not found
6. Rate limit awareness (show friendly message on 429)

### 4.6 Add invitation management UI (owner dashboard) [M]
**File:** `src/apps/gymmanager-web/src/app/(dashboard)/invitations/page.tsx` (new)

Simple form for owners/managers:
1. Email input + role dropdown + gym house dropdown
2. Submit creates invitation via `POST /invitations`
3. Show returned invite link (copy-to-clipboard)
4. No invite list/history in V1 (keep it simple)

## Dependencies
- API contract (api-contract-260321-1400.md)
- Phase 2 backend must be deployed for register to work
- Phase 3 backend must be deployed for invite flow to work

## Success Criteria
- [ ] Register page shows gym selector, sends gymHouseId
- [ ] Invite accept page at /invite/{token} works end-to-end
- [ ] Invitation creation form for owners
- [ ] Loading/error/empty states handled
- [ ] Form validation matches backend rules
