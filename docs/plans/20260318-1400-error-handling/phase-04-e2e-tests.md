# Phase 4: E2E Tests

## Goal
Verify error handling behavior in the browser with Playwright. Use `page.route()` to intercept API calls and return mock error responses.

## File Ownership
Owns:
- `tests/GymManager.E2E/specs/ui/error-handling.spec.ts` (NEW)
- `tests/GymManager.E2E/pages/error.page.ts` (NEW)

Must not touch: frontend source code, other spec files

## Implementation Steps

### 1. Error Page Object (`pages/error.page.ts`)
Follow existing page object pattern (see `login.page.ts`, `dashboard.page.ts`).

```typescript
export class ErrorPage {
  constructor(private page: Page) {}

  // 401
  get sessionExpiredHeading() { return this.page.getByRole("heading", { name: /session expired/i }); }
  get loginLink() { return this.page.getByRole("link", { name: /log in/i }); }

  // 403
  get accessDeniedHeading() { return this.page.getByRole("heading", { name: /access denied/i }); }
  get goToDashboardLink() { return this.page.getByRole("link", { name: /go to dashboard/i }); }

  // 500
  get somethingWentWrongHeading() { return this.page.getByRole("heading", { name: /something went wrong/i }); }
  get tryAgainButton() { return this.page.getByRole("button", { name: /try again/i }); }

  // Toast
  get errorToast() { return this.page.locator("[role='status']").filter({ hasText: /.+/ }); }
}
```

### 2. E2E Spec (`specs/ui/error-handling.spec.ts`)

Use `test` from `@fixtures/auth.fixture.js` for authenticated scenarios.

#### Test: 401 page renders correctly
```
- Navigate directly to /401
- Assert "Session Expired" heading is visible
- Assert login link is visible and points to /login
```

#### Test: 403 page renders correctly
```
- Navigate directly to /403
- Assert "Access Denied" heading is visible
- Assert "Go to Dashboard" link is visible
```

#### Test: 500 page renders correctly
```
- Navigate directly to /500
- Assert "Something Went Wrong" heading is visible
- Assert "Try Again" button is visible
- Assert "Go to Dashboard" link is visible
```

#### Test: 401 after token refresh failure redirects to /login
```
- Use authenticatedPage fixture
- Intercept ALL API calls with page.route("**/api/**", ...)
- Return 401 for the intercepted request
- Also intercept the refresh endpoint to return 401
- Navigate to /members (triggers API call)
- Assert URL changes to /login
```

#### Test: 403 on API call shows error toast
```
- Use authenticatedPage fixture
- Intercept GET /members with page.route() returning 403 + ProblemDetails body
- Navigate to /members
- Assert toast with "permission" text appears
```

#### Test: 500 on API call shows error toast
```
- Use authenticatedPage fixture
- Intercept GET /members with page.route() returning 500 + ProblemDetails body
- Navigate to /members
- Assert toast with "Something went wrong" text appears
```

#### Test: unauthenticated user visiting protected route goes to /login
Already covered in `auth.spec.ts` but worth a brief assertion here for completeness.

### 3. API Mocking Pattern
Use Playwright's `page.route()` for all error mocking:

```typescript
await page.route("**/api/v1/members**", (route) =>
  route.fulfill({
    status: 403,
    contentType: "application/problem+json",
    body: JSON.stringify({
      type: "https://tools.ietf.org/html/rfc7231#section-6.5.3",
      title: "Forbidden",
      status: 403,
      detail: "You do not have permission to access this resource.",
    }),
  })
);
```

This avoids needing a running backend in an error state and gives deterministic test behavior.

## Design Decisions
- Use `page.route()` rather than modifying backend state. Faster, isolated, no backend dependency.
- Test error pages as direct navigation (verify they render) AND as interceptor-triggered flows (verify the plumbing works).
- Keep the spec in `specs/ui/` alongside other UI tests (same project config, same browser setup).
- Don't test toast auto-dismiss timing in E2E (flaky). Just verify the toast appears.

## Success Criteria
- [ ] All 6 tests pass with `npx playwright test --project=ui error-handling`
- [ ] Tests use page.route() mocking, no real API error states needed
- [ ] Page object encapsulates all error page selectors
- [ ] Tests follow existing fixture and page object patterns
