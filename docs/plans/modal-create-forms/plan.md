# Plan: Convert All "Create New" Pages to Modal Overlays

**Scope:** Frontend-only
**Affected area:** `src/apps/gymmanager-web`
**Estimated files changed:** ~22 (1 new component, 9 form extractions, 9 list pages, 3 supporting)

---

## Phase 1 — Reusable FormModal Component

**Goal:** Build a generic modal component that wraps any create form.

### Task 1.1 — Create `FormModal` component
**File:** `src/components/ui/form-modal.tsx`

Build on the existing `<dialog>` pattern from `confirm-dialog.tsx`:
- Props: `isOpen`, `onClose`, `title`, `children`, `maxWidth?: "md" | "lg" | "xl"`
- Uses native `<dialog>` element with `showModal()`/`close()`
- Backdrop blur + click-to-close (same style as `confirm-dialog.tsx`)
- ESC key closes modal
- Scrollable body for long forms
- Focus trap within the modal
- Renders `children` (the form content) inside the modal body

```tsx
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: "md" | "lg" | "xl";
  children: React.ReactNode;
}
```

### Task 1.2 — Create `useCreateModal` hook
**File:** `src/hooks/use-create-modal.ts`

Manages modal open/close state synced with URL query param:
- Reads `?create=true` from `useSearchParams()` to determine initial state
- `open()` — pushes `?create=true` to URL via `router.push`
- `close()` — removes `create` param from URL via `router.push`
- `isOpen` — derived from search params
- Handles browser back button (popstate) gracefully

```tsx
function useCreateModal() {
  // Returns { isOpen, open, close }
}
```

---

## Phase 2 — Extract Form Content from Create Pages

**Goal:** Extract the form body from each `new/page.tsx` into a reusable form component that works both standalone and inside a modal.

Each form component receives an `onSuccess` callback and an `onCancel` callback instead of using `router.push` directly.

### Task 2.1 — Members
- **Extract from:** `members/new/page.tsx`
- **Create:** `src/components/forms/member-form.tsx`
- Props: `onSuccess: (member) => void`, `onCancel: () => void`
- Move schema, form logic, and JSX (everything inside `<Card>`) into the component
- Remove `PageHeader`, `Card` wrapper, `Link` cancel — use `onCancel` prop instead

### Task 2.2 — Gym Houses
- **Extract from:** `gym-houses/new/page.tsx`
- **Create:** `src/components/forms/gym-house-form.tsx`

### Task 2.3 — Staff
- **Extract from:** `staff/new/page.tsx`
- **Create:** `src/components/forms/staff-form.tsx`

### Task 2.4 — Announcements
- **Extract from:** `announcements/new/page.tsx`
- **Create:** `src/components/forms/announcement-form.tsx`

### Task 2.5 — Bookings
- **Extract from:** `bookings/new/page.tsx`
- **Create:** `src/components/forms/booking-form.tsx`

### Task 2.6 — Class Schedules
- **Extract from:** `class-schedules/new/page.tsx`
- **Create:** `src/components/forms/class-schedule-form.tsx`

### Task 2.7 — Transactions
- **Extract from:** `finance/transactions/new/page.tsx`
- **Create:** `src/components/forms/transaction-form.tsx`

### Task 2.8 — Payroll
- **Extract from:** `payroll/new/page.tsx`
- **Create:** `src/components/forms/payroll-form.tsx`

### Task 2.9 — Member Subscriptions
- **Extract from:** `members/[id]/subscriptions/new/page.tsx`
- **Create:** `src/components/forms/subscription-form.tsx`
- Note: This one receives `memberId` as a prop

---

## Phase 3 — Integrate Modals into List Pages

**Goal:** Replace `<Link href="/xxx/new">` buttons with modal triggers on each list page.

### Pattern for each list page:

```tsx
// Before
<Link href="/members/new">
  <Button>Add Member</Button>
</Link>

// After
const createModal = useCreateModal();

<Button onClick={createModal.open}>Add Member</Button>

<FormModal isOpen={createModal.isOpen} onClose={createModal.close} title="Add New Member">
  <MemberForm
    onSuccess={() => {
      createModal.close();
      toast.success("Member created successfully");
    }}
    onCancel={createModal.close}
  />
</FormModal>
```

### Task 3.1 — Members list page
**File:** `src/app/(dashboard)/members/page.tsx`
- Replace `<Link href="/members/new">` with modal trigger
- Add `FormModal` + `MemberForm`
- TanStack Query auto-invalidates on mutation success (already handled by `useCreateMember`)

### Task 3.2 — Gym Houses list page
**File:** `src/app/(dashboard)/gym-houses/page.tsx`

### Task 3.3 — Staff list page
**File:** `src/app/(dashboard)/staff/page.tsx`

### Task 3.4 — Announcements list page
**File:** `src/app/(dashboard)/announcements/page.tsx`

### Task 3.5 — Bookings list page
**File:** `src/app/(dashboard)/bookings/page.tsx`

### Task 3.6 — Class Schedules list page
**File:** `src/app/(dashboard)/class-schedules/page.tsx`

### Task 3.7 — Transactions list page
**File:** `src/app/(dashboard)/finance/transactions/page.tsx`
- Also update `src/app/(dashboard)/finance/page.tsx` (has a "Record Transaction" link)

### Task 3.8 — Payroll list page
**File:** `src/app/(dashboard)/payroll/page.tsx`

### Task 3.9 — Member detail page (subscriptions)
**File:** `src/app/(dashboard)/members/[id]/page.tsx`
- Replace `<Link href={/members/${id}/subscriptions/new}>` with modal
- Pass `memberId` to `SubscriptionForm`

---

## Phase 4 — Dashboard Quick Actions

**Goal:** Update the dashboard page's quick-action links to also open modals.

### Task 4.1 — Dashboard page
**File:** `src/app/(dashboard)/page.tsx`
- The dashboard has quick links to `/gym-houses/new` and `/members/new`
- Replace with modal triggers or keep as navigation links (modals on dashboard would need the form context)
- **Decision: Keep as navigation links** — the dashboard doesn't have the list context needed for the modal pattern. These links navigate to the list page with `?create=true`, which will auto-open the modal there.
- Update hrefs: `/members/new` → `/members?create=true`, `/gym-houses/new` → `/gym-houses?create=true`

---

## Phase 5 — Cleanup Old Create Pages

**Goal:** Remove or redirect the standalone `new/page.tsx` files.

### Task 5.1 — Redirect old routes
Each `new/page.tsx` becomes a redirect to the list page with `?create=true`:

```tsx
// members/new/page.tsx (simplified)
import { redirect } from "next/navigation";
export default function NewMemberPage() {
  redirect("/members?create=true");
}
```

This preserves any bookmarks or external links to the old URLs.

### Affected files (9):
- `members/new/page.tsx`
- `gym-houses/new/page.tsx`
- `staff/new/page.tsx`
- `announcements/new/page.tsx`
- `bookings/new/page.tsx`
- `class-schedules/new/page.tsx`
- `finance/transactions/new/page.tsx`
- `payroll/new/page.tsx`
- `members/[id]/subscriptions/new/page.tsx` → redirect to `/members/[id]?create=true`

---

## Phase 6 — Update Remaining Links

**Goal:** Find and update any other `href="/xxx/new"` links across the app.

### Task 6.1 — Scan and update stale links
From the grep results, these non-list pages also link to `/xxx/new`:
- `staff/page.tsx` line 155: `<Link href="/gym-houses/new">` (empty state message)
- `payroll/page.tsx` line 148: `<Link href="/gym-houses/new">` (empty state)
- `finance/pnl/page.tsx` line 74: `<Link href="/gym-houses/new">` (empty state)
- `finance/page.tsx` line 137: `<Link href="/gym-houses/new">` (empty state)
- `finance/transactions/page.tsx` line 196: `<Link href="/gym-houses/new">` (empty state)

Update all to `href="/gym-houses?create=true"`.

---

## Implementation Order

```
Phase 1 (foundation)  →  Phase 2 (extract forms)  →  Phase 3 (integrate modals)
                                                   →  Phase 4 (dashboard links)
                                                   →  Phase 5 (redirects)
                                                   →  Phase 6 (stale links)
```

Phases 3–6 can be done in parallel after Phase 2 completes.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modal implementation | Native `<dialog>` | Matches existing `confirm-dialog.tsx` pattern |
| URL sync | `?create=true` query param | Shareable, bookmarkable, works with browser back |
| Old routes | Redirect to list + query param | No broken bookmarks |
| Dashboard links | Navigate to list with `?create=true` | Dashboard lacks list context for inline modal |
| Form extraction | Separate component files | Reusable in both modal and potential future standalone contexts |
| Toast on success | Use existing `toast-store.ts` | Already in the app, no new dependency |

---

## Files Created (New)

| File | Purpose |
|------|---------|
| `src/components/ui/form-modal.tsx` | Reusable modal shell |
| `src/hooks/use-create-modal.ts` | URL-synced modal state |
| `src/components/forms/member-form.tsx` | Extracted member form |
| `src/components/forms/gym-house-form.tsx` | Extracted gym house form |
| `src/components/forms/staff-form.tsx` | Extracted staff form |
| `src/components/forms/announcement-form.tsx` | Extracted announcement form |
| `src/components/forms/booking-form.tsx` | Extracted booking form |
| `src/components/forms/class-schedule-form.tsx` | Extracted class schedule form |
| `src/components/forms/transaction-form.tsx` | Extracted transaction form |
| `src/components/forms/payroll-form.tsx` | Extracted payroll form |
| `src/components/forms/subscription-form.tsx` | Extracted subscription form |

## Files Modified

| File | Change |
|------|--------|
| 9 list pages | Replace Link with modal trigger + FormModal |
| 9 `new/page.tsx` files | Replace with redirect |
| `(dashboard)/page.tsx` | Update quick-action hrefs |
| ~5 empty-state links | Update `/xxx/new` → `/xxx?create=true` |
