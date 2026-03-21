# Implementation State — Owner Bootstrap & Invite Flow

## Topic
Owner Bootstrap, Member Registration, and Staff Invite Flow

## Discovery Context
- **Branch:** fix/integration_tests (continue on current)
- **Requirements:** All 4 ADR work items from docs/adrs/260321-owner-bootstrap-and-invite-flow.md
- **Test DB Strategy:** Docker containers (Testcontainers — real PostgreSQL)
- **Feature Scope:** fullstack
- **Task Type:** feature

## Phase-Specific Context
- **Plan Dir:** docs/plans/owner-bootstrap-invite-flow
- **Plan Source:** docs/plans/owner-bootstrap-invite-flow/plan.md
- **API Contract:** docs/plans/owner-bootstrap-invite-flow/api-contract-260321-1400.md
- **ADR:** docs/adrs/260321-owner-bootstrap-and-invite-flow.md

### Phase Summary
- Phase 0: Test Infrastructure (S) — CreateOwnerAsync, CreateMemberAsync, InvitationBuilder
- Phase 1: OwnerSeedService (M) — IHostedService, SeedOptions, env-var config
- Phase 2: Register Refactor + JWT Fix (L) — RegisterCommand adds GymHouseId, Role.Member, tenant_id claim
- Phase 3: Invite Link System (L) — Invitation entity, create/accept commands, crypto tokens
- Phase 4: Frontend Next.js (M) — register gym selector, invite accept page
- Phase 5: Mobile Flutter (M) — register gym dropdown, invite accept screen
- Phase 6: Integration + E2E (M) — full regression

### User Modifications
None — plan approved as-is.

### Human Approval Gates
- Phase 2 Task 2.9: Modifying ~30 existing test files requires human confirmation
