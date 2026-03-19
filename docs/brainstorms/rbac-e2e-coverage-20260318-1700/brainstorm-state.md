# Brainstorm State: RBAC E2E Test Coverage

## Topic
How to comprehensively cover all role and permission flows with E2E Playwright tests.

## Mode
Full workflow

## Discovery Answers

### Requirements
- **Full matrix**: Test every role x every route + every role x every permission-gated action
- **Success criteria**: Every role's allowed and denied actions are E2E tested

### Preferences
- **Hybrid approach**: API tests for permission boundaries (fast, reliable), UI tests for role-specific navigation/visibility
- No timeline pressure mentioned

## Scout Findings Summary
- 5 roles (Owner, HouseManager, Trainer, Staff, Member), 26 permissions, 16 routes
- All current E2E tests run as Owner only — zero multi-role coverage
- 50+ backend handlers check permissions, none verified by E2E
- PermissionGate/RoleGate used in 18+ frontend files, untested in E2E
- Auth fixture creates fresh Owner per test; no support for other roles
- role-fixture.ts exists but unused for permission boundary tests

## Raw Ideas

### Test Infrastructure
1. **Multi-role auth fixture**: Extend auth fixture to create users with specific roles (Owner creates gym house, then registers users and assigns roles via API)
2. **Role factory helper**: `createUserWithRole(role: Role)` that registers, creates staff/member record, returns auth context
3. **Permission matrix DSL**: Data-driven test generation from a JSON matrix of role x route x expected-status
4. **Shared gym house fixture**: One Owner sets up gym house + seed data, other role users are created within that tenant
5. **Token forge for roles**: Create JWTs with specific role/permission claims for testing without full user setup

### API Permission Boundary Tests
6. **Negative-case API matrix**: For each of 26 permissions, test that roles WITHOUT that permission get 403
7. **CRUD x role matrix**: For each entity (member, booking, staff, etc.), test create/read/update/delete per role
8. **Cross-tenant isolation tests**: Each role attempts to access another owner's resources
9. **Permission escalation tests**: Member tries to call Owner-only endpoints
10. **Batch permission boundary test**: Single test file per domain (members, bookings, finance, etc.) testing all 5 roles

### UI Route & Visibility Tests
11. **Route access matrix (UI)**: For each of 16 routes, navigate as each role — verify access or /403 redirect
12. **Sidebar visibility per role**: Verify sidebar shows correct nav items per role
13. **PermissionGate visibility**: Verify action buttons (Add Member, Delete, etc.) are hidden/shown per role
14. **RoleGate section visibility**: Verify page sections are hidden/shown per role
15. **Form field availability**: Some forms may have role-restricted fields

### Dynamic Permission Tests
16. **Permission update propagation**: Owner changes Trainer permissions → verify Trainer's UI updates in real-time via SignalR
17. **Role change mid-session**: Owner changes user from Staff to Member → verify restricted access
18. **Token refresh with new permissions**: After permission change, verify new token has updated claims

### Workflow/Journey Tests
19. **Cross-role workflows**: Owner creates gym house → HouseManager adds members → Trainer views bookings → Member views own data
20. **Delegation chain**: Owner delegates to HouseManager, HouseManager manages Staff, Staff manages Members
21. **Permission boundary journey**: Trainer tries to perform increasing privilege actions until hitting 403
22. **New user onboarding per role**: Test the first-login experience for each role type

### Test Organization
23. **File structure**: `specs/rbac/` directory with `api-permissions.spec.ts`, `ui-routes.spec.ts`, `ui-visibility.spec.ts`
24. **Parameterized tests**: Use Playwright's `test.describe` with role arrays to generate tests programmatically
25. **Test tags**: `@rbac`, `@role:owner`, `@permission:manage-members` for selective execution

## Confirmed Clusters

### Cluster A: Test Infrastructure (Ideas 1-5)
Build the foundation: multi-role fixtures, role factory, shared gym house setup.
- Novelty: 3/5 | Feasibility: 5/5 | Impact: 5/5

### Cluster B: API Permission Matrix (Ideas 6-10)
Comprehensive API-level permission boundary testing.
- Novelty: 3/5 | Feasibility: 4/5 | Impact: 5/5

### Cluster C: UI Route & Visibility Matrix (Ideas 11-15)
Test route access, sidebar, and UI element visibility per role.
- Novelty: 3/5 | Feasibility: 4/5 | Impact: 4/5

### Cluster D: Dynamic Permission Changes (Ideas 16-18)
Test real-time permission updates via SignalR.
- Novelty: 4/5 | Feasibility: 3/5 | Impact: 3/5

### Cluster E: Cross-Role Workflows (Ideas 19-22)
Multi-actor journey tests.
- Novelty: 4/5 | Feasibility: 3/5 | Impact: 4/5

### Cluster F: Test Organization (Ideas 23-25)
File structure, parameterization, tagging.
- Novelty: 2/5 | Feasibility: 5/5 | Impact: 3/5

## User Selection
All clusters confirmed — full matrix coverage required. Priority: A → B → C → E → D → F.
