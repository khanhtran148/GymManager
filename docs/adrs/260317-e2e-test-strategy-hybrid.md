# ADR: E2E Test Strategy — Hybrid (API-direct + Selective Playwright Browser)

**Date:** 2026-03-17
**Status:** Accepted
**Deciders:** Project Owner

## Context

GymManager has 15 API controllers, 5 user roles, and an existing Playwright E2E suite (9 specs) with significant coverage gaps. The team needs comprehensive E2E tests covering full user journeys per role, critical paths, and edge cases — both at the API level and in the browser.

## Decision

Adopt a **Hybrid approach** within the existing `tests/GymManager.E2E/` Playwright project:

1. **API-direct specs** (`specs/api/`) — Test business logic via HTTP calls using `api-client.ts`. No browser. Covers auth, booking lifecycle, subscriptions, multi-tenancy, transactions, payroll, shifts.
2. **Browser specs** (`specs/ui/`) — Existing 9 specs + targeted additions for UI-critical flows only (forms, navigation, dashboard rendering).
3. **Journey specs** (`specs/journeys/`) — End-to-end role flows: owner onboarding, member lifecycle, staff HR workflow.
4. **CI strategy** — API-only smoke on PR (~30s), full suite on merge to main (~5-8min), journey specs nightly (~10-15min).

## Alternatives Considered

| Approach | Score | Reason Rejected |
|----------|-------|-----------------|
| A: Playwright Browser Only | 6.2/10 | Slow, fragile selectors, poor CI speed |
| B: API-Level xUnit (WebApplicationFactory) | 7.4/10 | New project, misses UI bugs, duplicates existing Playwright API client |
| D: BDD Reqnroll | 6.0/10 | Gherkin overhead, step-def maintenance burden for solo maintainer |

## Consequences

**Positive:**
- Maximizes coverage breadth (API + UI) with minimum new infrastructure
- API specs are fast (~50-200ms each) and stable
- Extends existing project — no new tooling to learn
- Journey specs document real user workflows

**Negative:**
- TypeScript api-client.ts can drift from .NET DTOs (mitigate with shape assertions, future OpenAPI codegen)
- Still requires running services (not in-memory)
- Role-based tests skipped until permission enforcement lands
- Two mental models (API + browser) for contributors

## Implementation

3 phases: API specs first (~2 days), journey specs (~1 day), browser gap fills (~1 day).
