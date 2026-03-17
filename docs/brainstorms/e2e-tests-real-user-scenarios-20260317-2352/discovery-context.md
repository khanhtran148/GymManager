# Discovery Context — E2E Tests Real User Scenarios

## Requirements
- Comprehensive E2E tests covering full user journeys per role (Owner, Trainer, Staff, Member)
- Critical happy paths + edge cases + error scenarios
- Real-world actor perspectives: "What do I do first time? Second time? What if gym not created yet?"
- Both API-level E2E (HTTP calls) and Browser E2E (Playwright)
- Ship ASAP, iterate later — get core scenarios running fast, expand over time

## Scope
- **All of the above**: Full journeys per role, critical paths, AND edge cases/errors
- Roles: Owner (gym creator), HouseManager, Trainer, Staff, Member
- Key flows: auth, onboarding, gym house creation, member management, class booking, payments, staff/HR

## Context
- Ship ASAP, iterate later — prioritize getting tests running over perfect infrastructure
- Solo maintainer (user)
- Existing Playwright setup in tests/GymManager.E2E/ with 9 spec files
- Existing integration test infra with Testcontainers in test projects

## Preferences
- Both layers: API-level for logic coverage, Browser E2E for critical UI flows
- Build on existing Playwright setup for browser tests
- Use real API + real database (no mocks)
- Follow existing test patterns in the codebase

## Scout Findings Summary
1. 5 roles (Owner, HouseManager, Trainer, Staff, Member) — register always creates Owner with Admin perms
2. Onboarding chain: Register → Create GymHouse → then everything else. No gym house = blocked
3. 15 API controllers, most nested under /api/v1/gymhouses/{gymHouseId}/...
4. Major coverage gaps: waitlist, class schedule CRUD, payroll, shifts, notifications, role-based access, subscription renewal, booking no-show, transaction reversal
5. Auth: JWT 15min access + 7day rotating refresh, no email verification
