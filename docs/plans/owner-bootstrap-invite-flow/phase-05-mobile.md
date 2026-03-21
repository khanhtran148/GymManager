# Phase 5: Mobile (Flutter)
<!-- PARALLEL: runs simultaneously with Phase 3 and Phase 4 -->

## Purpose
Update mobile registration and add invite accept screen.

## FILE OWNERSHIP
Owns:
- `src/apps/gymmanager-mobile/lib/features/auth/` (new feature directory)
- `src/apps/gymmanager-mobile/lib/core/api/` (add endpoints)

Must not touch: any backend `src/core/`, `src/apps/GymManager.Api/`, `tests/`

## Implementation Steps

### 5.1 Create auth feature structure [S]
**Files:**
- `src/apps/gymmanager-mobile/lib/features/auth/data/models/register_request.dart`
- `src/apps/gymmanager-mobile/lib/features/auth/data/models/auth_response.dart`
- `src/apps/gymmanager-mobile/lib/features/auth/data/models/accept_invitation_request.dart`
- `src/apps/gymmanager-mobile/lib/features/auth/data/models/gym_house_public.dart`

Use Freezed for immutable models.

### 5.2 Add API endpoints [S]
**File:** `src/apps/gymmanager-mobile/lib/core/api/api_client.dart` (modify)

Add methods:
- `getPublicGymHouses()` -> `List<GymHousePublic>`
- `register(RegisterRequest)` -> `AuthResponse`
- `acceptInvitation(String token, AcceptInvitationRequest)` -> `AuthResponse`

### 5.3 Create register screen [M]
**File:** `src/apps/gymmanager-mobile/lib/features/auth/presentation/register_screen.dart`

- Fetch gym houses from API
- Dropdown for gym selection
- Form fields: fullName, email, password, confirmPassword, phone
- Validation matching backend rules
- Submit with gymHouseId

### 5.4 Create invite accept screen [M]
**File:** `src/apps/gymmanager-mobile/lib/features/auth/presentation/invite_accept_screen.dart`

- Deep link handling: `/invite/{token}` route
- Form: password, fullName
- Call accept endpoint
- Store tokens, navigate to home

### 5.5 Update router [S]
**File:** `src/apps/gymmanager-mobile/lib/core/router/app_router.dart`

Add routes:
- `/register` -> RegisterScreen
- `/invite/:token` -> InviteAcceptScreen

## Dependencies
- API contract
- Phase 2 + Phase 3 backends deployed

## Success Criteria
- [ ] Register screen with gym selector
- [ ] Invite accept screen via deep link
- [ ] Token storage after auth
- [ ] Form validation matches backend
