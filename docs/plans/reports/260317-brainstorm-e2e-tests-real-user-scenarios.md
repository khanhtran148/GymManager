# Brainstorm Report: E2E Tests — Real User Scenarios

**Date:** 2026-03-17
**Topic:** Comprehensive E2E test suite with real user scenarios per role
**Decision:** Hybrid approach (API-direct + selective Playwright browser)

## Summary

Brainstormed 24 test scenario ideas across 8 clusters for the GymManager E2E test suite. Evaluated 4 approaches; selected Hybrid (scored 7.6/10) for best coverage-to-speed ratio. The approach extends the existing Playwright project with API-direct specs for logic, browser specs for UI, and journey specs for end-to-end role flows.

## Clusters (All 8 Confirmed)

| Cluster | Score | Key Scenarios |
|---------|-------|---------------|
| A. Role Onboarding Journeys | 14/15 | Owner, Trainer, Staff, Member first-time + returning flows |
| B. Auth & Token Lifecycle | 12/15 | Expired tokens, refresh rotation, permission denied |
| C. Booking & Class Lifecycle | 13/15 | Full booking flow, double booking, waitlist, concurrent |
| D. Subscription & Payments | 12/15 | Subscribe, freeze, cancel, renew, expire |
| E. Multi-Tenancy & Isolation | 14/15 | Empty system, missing gym, cross-gym isolation, multi-gym |
| F. Staff & HR Operations | 9/15 | Shifts, payroll periods, staff management |
| G. Communication & Notifications | 7/15 | Announcements, notification delivery |
| H. Data Integrity | 11/15 | Soft delete, pagination, transaction reversal |

## Test Suite Structure

```
tests/GymManager.E2E/
├── fixtures/        (auth, role, gym-house fixtures)
├── helpers/         (api-client, test-data, assertions)
├── pages/           (page objects for browser specs)
├── specs/
│   ├── api/         (10 API-direct spec files)
│   ├── ui/          (9 existing + new browser specs)
│   └── journeys/    (3 end-to-end role journey specs)
```

## Implementation Phases

1. **API Specs** (~2 days): auth, booking, subscription, multi-tenancy, transaction, payroll, shifts, reports, notifications, waitlist
2. **Journey Specs** (~1 day): owner onboarding, member lifecycle, staff HR
3. **Browser Gap Fills** (~1 day): new page objects, UI-specific assertions

## Key Risks

- API client TypeScript drift from .NET DTOs (mitigate: shape assertions)
- Journey test flakiness (mitigate: cap 10 steps each)
- Role tests blocked until permission enforcement (mitigate: skip-marked stubs)

## CI Strategy

- **PR**: API-only smoke (~30s)
- **Merge to main**: Full API + browser (~5-8min)
- **Nightly**: Journey specs (~10-15min)

## ADR

See `docs/adrs/260317-e2e-test-strategy-hybrid.md`
