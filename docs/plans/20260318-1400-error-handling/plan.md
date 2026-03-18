# Plan: HTTP Error Handling (401, 403, 500)

## Overview
Add user-facing error handling to the GymManager Next.js frontend: dedicated error pages, an improved global Axios interceptor with toast notifications, inline error states in TanStack Query hooks, and Playwright E2E coverage.

## Feature Scope
Scope: frontend-only (backend already returns ProblemDetails)

## Current State Summary
- **403 page exists** at `src/apps/gymmanager-web/src/app/403/page.tsx` -- simple centered layout with "Access Denied" text and a dashboard link.
- **401 handling exists** in `src/lib/api-client.ts` -- token refresh on 401; redirect to `/login` on failure. No toast, no dedicated page.
- **No 500 handling** -- errors propagate as rejected promises. Pages like `members/page.tsx` render an `<Alert variant="error">` on query failure, but there is no global 500 page or toast.
- **No toast system** -- the codebase has no toast/snackbar component. The `notification-store.ts` and `notification-bell.tsx` handle backend push notifications, not UI toasts.
- **E2E tests** use Playwright with page objects, auth fixtures, and the `specs/ui/` directory for UI tests. No error-scenario coverage exists.

## Phases
| Phase | Name | Status | File |
|-------|------|--------|------|
| 1 | Toast system + error utility | pending | [phase-01-toast-and-utils.md](phase-01-toast-and-utils.md) |
| 2 | Error pages (401, 403, 500) | pending | [phase-02-error-pages.md](phase-02-error-pages.md) |
| 3 | Axios interceptor + TanStack Query error handling | pending | [phase-03-interceptor.md](phase-03-interceptor.md) |
| 4 | E2E tests | pending | [phase-04-e2e-tests.md](phase-04-e2e-tests.md) |

## Success Criteria
- [ ] `/401` page renders "Session expired" with login button
- [ ] `/403` page retains current design; also accessible at `/403` (already exists)
- [ ] `/500` page renders "Something went wrong" with retry/home buttons
- [ ] 401 after failed token refresh: clears auth, redirects to `/login`
- [ ] 403 on API call: shows toast "You don't have permission for this action"
- [ ] 500 on API call: shows toast "Something went wrong. Please try again later."
- [ ] TanStack Query hooks surface error states; pages render inline error UI
- [ ] Toast component supports success, error, info variants with auto-dismiss
- [ ] E2E tests cover: 401 redirect, 403 page, 500 page, toast on API errors
- [ ] Dark mode works for all new components
- [ ] Middleware PUBLIC_PATHS updated to include `/401` and `/500`

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Toast library bloat | Build a minimal toast with Zustand store + CSS transitions; no external dep |
| Route interception conflicts with middleware | Add `/401`, `/500` to PUBLIC_PATHS in middleware.ts |
| E2E tests need API mocking for error scenarios | Use Playwright `page.route()` to intercept and return mock error responses |
| Token refresh race with toast | Toast fires only after refresh fails (existing logic already handles this) |

## Planning Notes
- The existing 403 page style (centered, bg-background, text-6xl code, text-2xl heading, Link button) sets the visual pattern for 401 and 500 pages.
- The existing `Alert` component (`error`/`success` variants) handles inline errors. Toasts are a separate concern for transient notifications.
- Hooks like `use-members.ts` return `{ error }` from `useQuery` but mutations have no `onError` callback. Phase 3 adds a global mutation error handler via `QueryClient.defaultOptions.mutations.onError`.
- E2E tests should use `page.route()` to mock API responses rather than hitting the real backend with invalid tokens.
