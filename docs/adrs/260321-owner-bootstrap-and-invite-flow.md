# ADR: Owner Bootstrap, Member Registration, and Staff Invite Flow

**Date:** 2026-03-21
**Status:** Accepted
**Deciders:** Project Owner
**Context:** Brainstorm — owner-bootstrap-invite-flow-20260321-1000

## Decision

### Problem

The current `/api/v1/auth/register` endpoint creates users as `Role.Owner` with `Permission.Admin`. This is wrong: registration should create gym members, not owners. There is no mechanism to bootstrap the first owner on a fresh database, and no invite flow for staff/manager/trainer roles.

Additionally, `CurrentUser.TenantId` returns `UserId` for all users, which is only correct for Owners — a data isolation bug for non-owner users.

### Chosen Approach

Four changes, implemented in order:

**1. OwnerSeedService (IHostedService)**
- Reads `Seed:Owner:Email`, `Seed:Owner:Password`, `Seed:Owner:GymName` from configuration (env vars override)
- Creates Owner user + GymHouse + role_permissions on first startup if no owners exist
- Idempotent: skips if any Owner already exists (checks by role, not email)
- Fail-fast: refuses to start if DB has zero owners AND seed config is missing
- Uses `IOptions<SeedOptions>` with `ValidateOnStart()`
- Catches unique constraint violations for concurrent pod starts

**2. Register Refactor (Member Self-Signup)**
- Add `GymHouseId` to `RegisterCommand`
- Handler creates User with `Role.Member` (not Owner)
- Handler creates a Member record linking user to gym house
- Handler ensures `role_permissions` exist for the tenant (via `UpsertRangeAsync`)
- `JwtTokenService` embeds `tenant_id` as a JWT claim (Owner: UserId, Member: GymHouse.OwnerId)
- `CurrentUser.TenantId` reads from JWT claim instead of returning `UserId`

**3. Invite Link System**
- New `Invitation` entity: Id, TenantId, Email, Role, GymHouseId, Token, ExpiresAt, AcceptedAt, CreatedBy
- `POST /api/v1/invitations` — Owner/Manager creates invite (permission: ManageStaff or ManageRoles)
- `POST /api/v1/invitations/{token}/accept` — anonymous, rate-limited (Auth policy)
- Token: 32-byte cryptographic random, URL-safe Base64
- 48-hour expiry, single-use
- Accept flow checks for existing user by email: link if found, create if not
- Unique constraint on (email, tenant_id) for pending invites
- No email delivery in V1 — invite link returned via API response

**4. Test Infrastructure**
- `CreateOwnerAsync()` on IntegrationTestBase — seeds User + GymHouse + role_permissions
- `CreateMemberAsync(gymHouseId)` — seeds User + Member + role_permissions
- `InvitationBuilder` for invite flow tests
- Update all existing tests that assume register = owner

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| CLI seed command | Not 12-factor; requires manual step before app starts |
| SQL migration seed | Cannot read env vars portably; one-time only |
| Domain event for role_permissions seeding | Makes registration correctness depend on RabbitMQ; violates cross-phase rule #5 |
| JWT-based invite tokens | Payload visible in URL, revocation complexity, signing key management overhead |
| Separate JoinGym command after register | Two API calls, broken intermediate state, worse UX |
| Runtime TenantId resolution (current) | DB query per request, cache invalidation headaches, RLS data isolation bug |

### Consequences

**Positive:**
- First deployment has a working owner account from env vars
- Registration creates members (correct per business model)
- Staff onboarding via invite links (no manual account creation)
- TenantId in JWT fixes data isolation for non-owner users
- role_permissions seeded consistently for all tenants

**Negative:**
- Breaking change to `RegisterCommand` API contract (new required `GymHouseId` field)
- Single active tenant per JWT session (multi-gym switching deferred)
- No email delivery for invites in V1
- Existing tests need updating (register no longer creates owners)

### Risks

| Risk | Mitigation |
|---|---|
| CurrentUser.TenantId not updated → RLS data leak | Integration test asserting TenantId for Member user |
| Existing tests break | Test infra (item 4) implemented alongside register refactor |
| Invite token brute-force | 256-bit token + rate limiting |
| RegisterCommand API breaking change | Frontend/mobile updated simultaneously; or make GymHouseId optional with 400 if missing |
