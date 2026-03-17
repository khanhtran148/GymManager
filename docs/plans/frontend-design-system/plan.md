# Frontend Design System Plan

**Date:** 2026-03-17
**Scope:** Frontend-only (Next.js)
**Branch:** `feat/phase-1-foundation`
**Base path:** `src/apps/gymmanager-web/src/`

## Problem

Tailwind CSS v4 uses `@custom-variant dark (&:where(.dark, .dark *))` which wraps dark selectors in `:where()` -- zero specificity. Any plain utility like `bg-white` beats `dark:bg-surface-800`. Result: dark mode is broken across ~20 files.

The codebase already proved a fix on cards and sidebar: define semantic CSS custom properties in `@theme`, override them in `.dark {}`, then use single-token classes (`bg-card`). This plan extends that pattern to every remaining component and page.

Secondary problem: repeated UI patterns (error alerts, loading spinners, back-button headers) are copy-pasted across 6+ files, violating DRY.

## Audit Summary

### Broken `dark:` pairs found (must be replaced with tokens)

| Pattern | Files affected |
|---|---|
| `bg-white dark:bg-*` / `bg-surface-50 dark:bg-surface-*` | top-bar, dashboard layout, stat-card, data-table, member detail, confirm-dialog |
| `text-surface-900 dark:text-white` | sidebar, top-bar, card-title, stat-card, dashboard, gym-houses, members (~12 files) |
| `text-surface-* dark:text-surface-*` (secondary/muted pairs) | Every page and component (~20 files) |
| `border-surface-* dark:border-*` | card, data-table, dashboard, confirm-dialog, top-bar, subscription-card |
| `bg-red-50 dark:bg-red-900/20` (error alert) | gym-houses/page, gym-houses/[id], gym-houses/new, members/page, members/new, members/[id], subscriptions/new |
| `bg-accent-50 dark:bg-accent-900/20` (success alert) | gym-houses/[id] |
| `hover:bg-surface-* dark:hover:bg-*` | sidebar, top-bar, theme-toggle, confirm-dialog |

### Duplicated UI patterns (must be extracted)

| Pattern | Occurrences | Extract to |
|---|---|---|
| Error alert div (`bg-red-50 dark:bg-red-900/20 border...`) | 7 files | `<Alert variant="error">` |
| Success alert div (`bg-accent-50 dark:bg-accent-900/20...`) | 1 file (will grow) | `<Alert variant="success">` |
| Loading spinner (`border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin`) | 4 files (gym-houses/[id], members/[id], data-table, members/[id] subs) | `<Spinner>` |
| Back-button + breadcrumb header (`ChevronLeft` link + category label + title) | 5 files (gym-houses/new, gym-houses/[id], members/new, members/[id], subscriptions/new) | `<PageHeader>` |
| Auth card glass wrapper (`bg-white/[0.04] backdrop-blur-xl...`) | 2 files (login, register) | `<AuthCard>` |
| Auth input overrides (`bg-white/[0.06] border-white/10 text-white...`) | 6 inputs across login + register | CSS class `.input-auth` or token |

---

## Phase 1: Design Token Foundation

**Goal:** Define all semantic CSS custom properties. No component changes yet.

**File ownership:** `app/globals.css` only.

### Tasks

**1.1** Add the full semantic token set inside `@theme {}`:

```
/* Page backgrounds */
--color-page: #f8fafc;          /* surface-50 */
--color-page-inset: #f1f5f9;    /* surface-100 */

/* Text hierarchy */
--color-text-primary: #0f172a;   /* surface-900 */
--color-text-secondary: #475569; /* surface-600 */
--color-text-muted: #94a3b8;     /* surface-400 */
--color-text-inverted: #ffffff;

/* Borders */
--color-border: #e2e8f0;         /* surface-200 */
--color-border-muted: #f1f5f9;   /* surface-100 */

/* Interactive surfaces */
--color-hover: #f1f5f9;          /* surface-100 */
--color-table-header: rgba(248, 250, 252, 0.8);
--color-table-row-hover: rgba(255, 247, 237, 0.3); /* primary-50/30 */
--color-table-divider: #f8fafc;

/* TopBar */
--color-topbar: rgba(255, 255, 255, 0.8);
--color-topbar-border: #f1f5f9;

/* Feedback backgrounds */
--color-error-bg: #fef2f2;       /* red-50 */
--color-error-border: #fecaca;   /* red-200 */
--color-error-text: #dc2626;     /* red-600 */
--color-success-bg: #ecfdf5;     /* accent-50 */
--color-success-border: #a7f3d0; /* accent-200 */
--color-success-text: #047857;   /* accent-700 */

/* Notification dot border */
--color-dot-border: #ffffff;
```

**1.2** Add dark overrides in `.dark {}`:

```
--color-page: #141821;           /* surface-950 */
--color-page-inset: #1a1f2e;     /* surface-900 */
--color-text-primary: #ffffff;
--color-text-secondary: #cbd5e1;  /* surface-300 */
--color-text-muted: #64748b;      /* surface-500 */
--color-text-inverted: #0f172a;
--color-border: transparent;
--color-border-muted: #2d3548;    /* surface-700 */
--color-hover: #2d3548;           /* surface-700 */
--color-table-header: rgba(36, 43, 61, 0.4);
--color-table-row-hover: rgba(45, 53, 72, 0.3);
--color-table-divider: #2d3548;
--color-topbar: rgba(26, 31, 46, 0.8);
--color-topbar-border: #2d3548;
--color-error-bg: rgba(153, 27, 27, 0.2);
--color-error-border: rgba(153, 27, 27, 0.5);
--color-error-text: #f87171;
--color-success-bg: rgba(6, 78, 59, 0.2);
--color-success-border: rgba(6, 78, 59, 0.5);
--color-success-text: #34d399;
--color-dot-border: #1a1f2e;
```

**1.3** Keep existing tokens (`--color-card`, `--color-card-inset`, `--color-sidebar-bg`, `--color-sidebar-border-color`) as-is.

**Complexity:** Low. Single file, additive only.
**Verification:** `npm run build` passes. Visual check: no change (tokens not consumed yet).

---

## Phase 2: Extract Reusable Components

**Goal:** Create shared components for duplicated patterns. Use the new tokens.

**File ownership:** New files in `components/ui/` only.

### Tasks

**2.1** Create `components/ui/alert.tsx`

```tsx
// Props: variant ("error" | "success" | "info"), children, className
// Uses: bg-error-bg border-error-border text-error-text (etc.)
// Replaces the 7+ copy-pasted error alert divs
```

Variants:
- `error`: `bg-error-bg border border-error-border text-error-text rounded-xl px-4 py-3 text-sm`
- `success`: `bg-success-bg border border-success-border text-success-text rounded-xl px-4 py-3 text-sm`
- Both include `role="alert"`

**2.2** Create `components/ui/spinner.tsx`

```tsx
// Props: size ("sm" | "md"), className
// The border-spinner pattern extracted once
// sm: w-5 h-5, md: w-6 h-6 (current uses vary between 5-8)
```

**2.3** Create `components/ui/page-header.tsx`

```tsx
// Props: backHref, backLabel, breadcrumb (string), title, actions? (ReactNode)
// Renders: ChevronLeft link + breadcrumb label + h2 title + optional right-side actions
// Uses tokens for text colors
```

**2.4** Create `components/ui/auth-card.tsx`

```tsx
// Wraps the glass morphism card used on login + register
// The shared logo + branding header
// Includes the glass input class token
```

**Complexity:** Medium. Four new files, no existing files touched yet.
**Verification:** `npm run build` passes (new files, unused so far).

---

## Phase 3: Migrate UI Components to Tokens

**Goal:** Replace all `dark:` class pairs in `components/ui/` and `components/` with semantic token classes.

**File ownership:** All files in `components/` (existing files only).

### 3.1 `components/ui/card.tsx`
- `border border-surface-100 dark:border-transparent` -> `border border-border`
- `text-surface-900 dark:text-surface-100` (CardTitle) -> `text-text-primary`

### 3.2 `components/ui/stat-card.tsx`
- `border border-surface-100 dark:border-transparent` -> `border border-border`
- `text-surface-900 dark:text-white` -> `text-text-primary`
- `text-surface-500 dark:text-surface-400` -> `text-text-muted`
- `text-surface-400 dark:text-surface-500` -> `text-text-muted`
- `bg-surface-100 dark:bg-surface-700` (progress bar bg) -> `bg-hover` or new `--color-progress-track`
- Remaining `dark:bg-*-900/20` on iconBg -- these are status-color-specific, keep as-is (they use Tailwind color scales, not affected by the specificity bug since they don't conflict with a non-dark utility).

### 3.3 `components/ui/data-table.tsx`
- `border border-surface-100 dark:border-transparent bg-card` -> `border border-border bg-card`
- `divide-surface-100 dark:divide-surface-700` -> use a token or keep (divide isn't affected by specificity since both use `dark:`)
- `bg-surface-50/80 dark:bg-surface-800/40` (thead) -> `bg-table-header`
- `text-surface-500 dark:text-surface-400` -> `text-text-muted`
- `divide-surface-50 dark:divide-surface-700` -> `divide-border-muted`... actually use `divide-table-divider`
- `hover:bg-primary-50/30 dark:hover:bg-surface-700/30` -> `hover:bg-table-row-hover`
- `text-surface-700 dark:text-surface-300` -> `text-text-secondary`
- `text-surface-400 dark:text-surface-500` -> `text-text-muted`
- Loading spinner -> replace with `<Spinner />`

### 3.4 `components/ui/input.tsx`
- `text-surface-900 dark:text-surface-100` -> `text-text-primary`
- `border-surface-200 dark:border-surface-700` -> `border-border` / `border-border-muted`
- `disabled:bg-surface-50 dark:disabled:bg-surface-800` -> keep (disabled state, low priority) or add `--color-disabled-bg`
- `placeholder-surface-400 dark:placeholder-surface-500` -> `placeholder-text-muted`

### 3.5 `components/ui/select.tsx`
- Same changes as input.tsx (identical class structure).

### 3.6 `components/ui/badge.tsx`
- The statusStyles object uses `dark:` pairs. These are status-specific colors (accent, blue, red). The specificity issue applies here since `bg-accent-50` beats `dark:bg-accent-900/20`. Options:
  - Add per-status tokens (overkill)
  - Use `!important` on dark variants (ugly)
  - Better: restructure to use CSS custom properties inline via `style` prop
  - Simplest: define tokens `--color-badge-active-bg`, etc. in globals.css
  - **Decision:** Add badge-specific tokens. There are only 4 statuses.

### 3.7 `components/ui/form-field.tsx`
- `text-surface-700 dark:text-surface-300` -> `text-text-secondary`
- `text-surface-400 dark:text-surface-500` -> `text-text-muted`

### 3.8 `components/ui/button.tsx`
- `secondary` variant: `dark:text-surface-200` -> use token, `dark:border-surface-700` -> `border-border-muted`, `dark:hover:bg-surface-700` -> `hover:bg-hover`
- `ghost` variant: `dark:text-surface-400` -> `text-text-muted`, `dark:hover:bg-surface-800` -> `hover:bg-hover`
- `dark:focus-visible:ring-offset-surface-900` -> `focus-visible:ring-offset-page`
- Spinner SVG inside button -> replace with `<Spinner size="sm" />`

### 3.9 `components/ui/confirm-dialog.tsx`
- `bg-card` already uses token (good)
- `border border-surface-100 dark:border-transparent` -> `border border-border`
- `dark:bg-red-900/20` -> add token if needed, or keep (red-50 vs dark:red-900/20 has the specificity issue) -> add `--color-danger-bg` / `--color-danger-bg-dark`
- `text-surface-900 dark:text-surface-100` -> `text-text-primary`
- `text-surface-500 dark:text-surface-400` -> `text-text-muted`
- Close button hover states: `dark:hover:*` pairs -> token-based
- X button: `hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-200 dark:hover:bg-surface-700` -> simplify to `hover:text-text-secondary hover:bg-hover`

### 3.10 `components/sidebar.tsx`
- Already uses `bg-sidebar-bg` and `border-sidebar-border-color` tokens (good)
- Remaining `dark:` pairs on nav items:
  - `text-surface-900 dark:text-white` -> `text-text-primary`
  - `text-surface-400 dark:text-surface-500` -> `text-text-muted`
  - `text-surface-500 dark:text-surface-400` -> `text-text-muted`
  - Active nav: `bg-primary-50 dark:bg-primary-500/15` -> needs token `--color-nav-active-bg`
  - Hover nav: `hover:bg-surface-100 dark:hover:bg-white/5` -> needs token `--color-nav-hover-bg`
  - Icon backgrounds similarly
  - Upgrade card: `bg-primary-50 dark:bg-primary-500/10` -> token
- **Note:** Sidebar has many nav-specific `dark:` pairs. Add sidebar-specific tokens.

### 3.11 `components/top-bar.tsx`
- `bg-white/80 dark:bg-surface-900/80` -> `bg-topbar`
- `border-surface-100 dark:border-surface-700` -> `border-topbar-border`
- `text-surface-900 dark:text-white` -> `text-text-primary`
- `text-surface-400 dark:text-surface-500` -> `text-text-muted`
- Hover states on icon buttons -> `hover:bg-hover hover:text-text-secondary`
- Notification dot border: `border-white dark:border-surface-900` -> `border-dot-border`
- Divider: `bg-surface-200 dark:bg-surface-700` -> `bg-border`
- Dropdown: already uses `bg-card` (good), `border-surface-100 dark:border-transparent` -> `border-border`

### 3.12 `components/theme-toggle.tsx`
- `dark:text-surface-400 dark:hover:text-surface-200 dark:hover:bg-surface-800` -> token-based hover
- Simplify to `text-text-muted hover:text-text-secondary hover:bg-hover`

### 3.13 `components/subscription-card.tsx`
- `bg-card` already token (good)
- `border border-surface-100 dark:border-transparent` -> `border border-border`
- Text pairs -> `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Renew form section: `bg-surface-50 dark:bg-surface-700/30` -> `bg-card-inset`
- Renew form border: `border-surface-100 dark:border-surface-700` -> `border-border-muted`

**Complexity:** High. 13 files, many class replacements per file. Must be done methodically.
**Verification:** `npm run build`. Visual comparison of light and dark mode on every page.

---

## Phase 4: Migrate Pages to Tokens + Use Extracted Components

**Goal:** Replace `dark:` pairs and duplicated patterns in all page files.

**File ownership:** All files in `app/` (page.tsx and layout.tsx files only).

### 4.1 `app/(dashboard)/layout.tsx`
- `bg-surface-50 dark:bg-surface-950` -> `bg-page`

### 4.2 `app/(dashboard)/page.tsx` (Dashboard)
- Card containers: `bg-card rounded-2xl border border-surface-100 dark:border-transparent` -> `bg-card rounded-2xl border border-border`
- All `text-surface-900 dark:text-white` -> `text-text-primary`
- All `text-surface-* dark:text-surface-*` secondary/muted pairs -> token classes
- `border-surface-50 dark:border-surface-700` -> `border-border-muted`
- Quick action hover: `dark:hover:border-surface-700/50` -> token
- Progress bar track: `bg-surface-100 dark:bg-surface-700` -> `bg-hover` or token

### 4.3 `app/(dashboard)/gym-houses/page.tsx`
- Error alert -> `<Alert variant="error">Failed to load gym houses.</Alert>`
- Text pairs -> tokens

### 4.4 `app/(dashboard)/gym-houses/new/page.tsx`
- Back-button header -> `<PageHeader backHref="/gym-houses" breadcrumb="Gym Houses" title="Add New Gym House" />`
- Error alert -> `<Alert variant="error">{serverError}</Alert>`
- Back link class pattern -> removed (handled by PageHeader)

### 4.5 `app/(dashboard)/gym-houses/[id]/page.tsx`
- Loading spinner -> `<Spinner />` with message
- Error alert -> `<Alert variant="error">`
- Success alert -> `<Alert variant="success">`
- Back-button header -> `<PageHeader>`

### 4.6 `app/(dashboard)/members/page.tsx`
- Error alert -> `<Alert variant="error">`

### 4.7 `app/(dashboard)/members/new/page.tsx`
- Back-button header -> `<PageHeader>`
- Error alert -> `<Alert variant="error">`

### 4.8 `app/(dashboard)/members/[id]/page.tsx`
- Loading spinner -> `<Spinner />`
- Error alert -> `<Alert variant="error">`
- Back-button header -> `<PageHeader>` (with actions slot for "Add Subscription" button)
- Text pairs -> tokens
- Info card icon backgrounds: `bg-surface-50 dark:bg-surface-700/50` -> `bg-card-inset`
- Member code badge bg: `bg-surface-50 dark:bg-surface-700/50` -> `bg-card-inset`
- Subscriptions loading spinner -> `<Spinner />`

### 4.9 `app/(dashboard)/members/[id]/subscriptions/new/page.tsx`
- Back-button header -> `<PageHeader>`
- Error alert -> `<Alert variant="error">`

### 4.10 `app/(auth)/login/page.tsx`
- Glass card wrapper -> `<AuthCard title="Welcome back" subtitle="Sign in to your account to continue">`
- Error alert -> `<Alert variant="error">` (auth-styled variant or inline, since auth uses different color scheme)
- Input overrides (`bg-white/[0.06] border-white/10...`) -> add `.input-auth` utility class in globals.css or keep inline (only 2 files)
- **Decision:** Add `--color-auth-input-bg`, `--color-auth-input-border` tokens for cleanliness. No light/dark toggle needed on auth pages (always dark bg).

### 4.11 `app/(auth)/register/page.tsx`
- Same as login -- use `<AuthCard>` and auth input tokens.

**Complexity:** High. 11 files, many replacements per file.
**Verification:** `npm run build`. Dark mode toggle on every page. Auth pages still look correct.

---

## Phase 5: Cleanup and Verification

**Goal:** Remove dead code, verify zero `dark:bg-white`, `bg-white dark:`, or conflicting pairs remain.

**File ownership:** All `src/` files.

### Tasks

**5.1** Search for remaining `dark:` classes that conflict with non-dark counterparts. Allowed `dark:` usage:
- Status-specific colors where no conflicting non-dark exists (e.g., `dark:text-primary-300` without a base `text-primary-*` override)
- Cases with no specificity conflict

**5.2** Remove unused imports (if any components were replaced).

**5.3** Run `npm run build` and fix any TypeScript/build errors.

**5.4** Manual visual test checklist:
- [ ] Dashboard: light + dark
- [ ] Gym houses list: light + dark
- [ ] Gym house create: light + dark
- [ ] Gym house edit: light + dark (with success toast)
- [ ] Members list: light + dark
- [ ] Member create: light + dark
- [ ] Member detail: light + dark
- [ ] Subscription create: light + dark
- [ ] Login page
- [ ] Register page

**Complexity:** Low-Medium. Grep + fix stragglers.

---

## Execution Order

```
Phase 1 (tokens)
    |
Phase 2 (new components) -- can start after Phase 1
    |
Phase 3 (migrate components) + Phase 4 (migrate pages) -- sequential, components first
    |
Phase 5 (cleanup)
```

Total phases: 5, sequential.

## File Change Summary

| File | Phase | Change type |
|---|---|---|
| `app/globals.css` | 1 | Add ~40 token definitions |
| `components/ui/alert.tsx` | 2 | New file |
| `components/ui/spinner.tsx` | 2 | New file |
| `components/ui/page-header.tsx` | 2 | New file |
| `components/ui/auth-card.tsx` | 2 | New file |
| `components/ui/card.tsx` | 3 | Replace dark: pairs |
| `components/ui/stat-card.tsx` | 3 | Replace dark: pairs |
| `components/ui/data-table.tsx` | 3 | Replace dark: pairs + use Spinner |
| `components/ui/input.tsx` | 3 | Replace dark: pairs |
| `components/ui/select.tsx` | 3 | Replace dark: pairs |
| `components/ui/badge.tsx` | 3 | Add badge tokens, replace dark: pairs |
| `components/ui/form-field.tsx` | 3 | Replace dark: pairs |
| `components/ui/button.tsx` | 3 | Replace dark: pairs + use Spinner |
| `components/ui/confirm-dialog.tsx` | 3 | Replace dark: pairs |
| `components/sidebar.tsx` | 3 | Add nav tokens, replace dark: pairs |
| `components/top-bar.tsx` | 3 | Replace dark: pairs |
| `components/theme-toggle.tsx` | 3 | Replace dark: pairs |
| `components/subscription-card.tsx` | 3 | Replace dark: pairs |
| `app/(dashboard)/layout.tsx` | 4 | bg-page token |
| `app/(dashboard)/page.tsx` | 4 | Tokens + extracted components |
| `app/(dashboard)/gym-houses/page.tsx` | 4 | Alert component |
| `app/(dashboard)/gym-houses/new/page.tsx` | 4 | PageHeader + Alert |
| `app/(dashboard)/gym-houses/[id]/page.tsx` | 4 | PageHeader + Alert + Spinner |
| `app/(dashboard)/members/page.tsx` | 4 | Alert component |
| `app/(dashboard)/members/new/page.tsx` | 4 | PageHeader + Alert |
| `app/(dashboard)/members/[id]/page.tsx` | 4 | PageHeader + Alert + Spinner |
| `app/(dashboard)/members/[id]/subscriptions/new/page.tsx` | 4 | PageHeader + Alert |
| `app/(auth)/login/page.tsx` | 4 | AuthCard + auth tokens |
| `app/(auth)/register/page.tsx` | 4 | AuthCard + auth tokens |

**Total files modified:** 25 existing + 4 new = 29 files.

## Complexity Estimate

- Phase 1: **Low** (~30 min) -- adding CSS variables
- Phase 2: **Medium** (~45 min) -- 4 new components
- Phase 3: **High** (~2 hours) -- 13 files, many class replacements
- Phase 4: **High** (~1.5 hours) -- 11 files, component swaps + token migration
- Phase 5: **Low** (~30 min) -- grep + verify

**Total estimated effort: ~5 hours**

## Constraints

- No business logic, hooks, stores, types, or API calls change
- Preserve the FitNexus visual design exactly
- Both light and dark modes must work
- `npm run build` must pass with zero errors after each phase
- Keep existing `@theme` tokens that already work (`--color-card`, etc.)
