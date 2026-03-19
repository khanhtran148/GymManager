# Phase 2: Error Pages (401, 403, 500)

## Goal
Create dedicated error pages for 401 and 500. Update the existing 403 page for consistency. Register new routes in middleware's PUBLIC_PATHS.

## File Ownership
Owns:
- `src/apps/gymmanager-web/src/app/401/page.tsx` (NEW)
- `src/apps/gymmanager-web/src/app/500/page.tsx` (NEW)
- `src/apps/gymmanager-web/src/app/403/page.tsx` (MODIFY -- minor consistency tweaks)
- `src/apps/gymmanager-web/src/middleware.ts` (MODIFY -- add routes to PUBLIC_PATHS)

Must not touch: `src/lib/api-client.ts`, hooks, toast system, E2E tests

## Implementation Steps

### 1. Create 401 Page (`src/app/401/page.tsx`)
Follow the 403 page's exact layout pattern:
- Centered flex container, `min-h-screen bg-background`
- Large "401" number in `text-6xl font-bold text-text-muted`
- Heading: "Session Expired"
- Body: "Your session has expired. Please log in again to continue."
- Primary action: Link to `/login` styled as primary button (same classes as 403's dashboard link)
- Server component (no `"use client"` needed)

### 2. Create 500 Page (`src/app/500/page.tsx`)
Same layout pattern as 401/403:
- Large "500" number
- Heading: "Something Went Wrong"
- Body: "We encountered an unexpected error. Please try again or return to the dashboard."
- Two actions:
  - "Try Again" button: `"use client"` wrapper needed for `router.back()` or `window.location.reload()`
  - "Go to Dashboard" link: same style as 403 page, links to `/`
- Since "Try Again" needs client JS, make this a client component or extract the button into a small client component

### 3. Update 403 Page (`src/app/403/page.tsx`)
Minor tweaks for consistency:
- Add a secondary "Go Back" button using `router.back()` (needs `"use client"`)
- Keep the existing "Go to Dashboard" link
- Match heading style to other pages: keep "Access Denied" as-is (already good)

### 4. Update Middleware (`src/middleware.ts`)
Add `/401` and `/500` to `PUBLIC_PATHS`:
```typescript
const PUBLIC_PATHS = ["/login", "/register", "/401", "/403", "/500"];
```

Also update the authenticated-user redirect guard to allow visiting error pages:
```typescript
if (isAuthenticated && isPublic && !["/403", "/401", "/500"].includes(pathname)) {
```
This prevents authenticated users from being redirected away from error pages.

## Design Decisions
- Error pages are standalone routes (not Next.js `error.tsx` boundaries) because they are navigation targets from the interceptor and middleware, not caught rendering errors.
- The 500 page uses client-side "Try Again" because `router.back()` needs `useRouter`.
- Keep pages simple: no illustrations or animations.

## Success Criteria
- [ ] `/401` renders with "Session Expired" heading and login link
- [ ] `/403` renders with "Access Denied" heading plus go-back and dashboard links
- [ ] `/500` renders with "Something Went Wrong" heading plus retry and dashboard links
- [ ] Unauthenticated users can access all three pages without redirect
- [ ] Authenticated users can access all three pages without redirect to `/`
- [ ] All pages match the existing design system (Tailwind tokens, dark mode)
