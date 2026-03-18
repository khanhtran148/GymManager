# Phase 1: Toast System + Error Utilities

## Goal
Create a lightweight toast notification system and a shared error-parsing utility that the interceptor and hooks will use in later phases.

## File Ownership
Owns:
- `src/apps/gymmanager-web/src/stores/toast-store.ts` (NEW)
- `src/apps/gymmanager-web/src/components/ui/toast.tsx` (NEW)
- `src/apps/gymmanager-web/src/components/toast-container.tsx` (NEW)
- `src/apps/gymmanager-web/src/lib/error-utils.ts` (NEW)
- `src/apps/gymmanager-web/src/app/layout.tsx` (MODIFY -- add ToastContainer)

Must not touch: `src/lib/api-client.ts`, error pages, hooks, E2E tests

## Implementation Steps

### 1. Toast Zustand Store (`src/stores/toast-store.ts`)
- State: `toasts: Toast[]` where `Toast = { id: string, message: string, variant: "success" | "error" | "info", duration?: number }`
- Actions: `addToast(toast)`, `removeToast(id)`
- `addToast` auto-generates UUID id and sets a `setTimeout` to remove after `duration` (default 5000ms)
- No persistence -- toasts are ephemeral

### 2. Toast UI Component (`src/components/ui/toast.tsx`)
- Renders a single toast item with dismiss button (X)
- Variants map to existing design tokens:
  - `error`: red/error colors (same palette as `Alert` error variant)
  - `success`: green/success colors (same as `Alert` success variant)
  - `info`: primary-500 tint
- CSS transition: fade-in from right, fade-out on dismiss
- `role="status"` + `aria-live="polite"` for accessibility

### 3. Toast Container (`src/components/toast-container.tsx`)
- `"use client"` component
- Reads `toasts` from `useToastStore()`
- Renders toasts in a fixed position container (top-right, `z-50`)
- Maps over toasts, renders `<Toast>` for each
- Add to `layout.tsx` inside `<ThemeProvider>` but outside `<QueryProvider>` (toasts don't need query context)

### 4. Error Parsing Utility (`src/lib/error-utils.ts`)
- `parseApiError(error: unknown): { status: number | null, message: string, detail: string | null }`
- Handles AxiosError with ProblemDetails body: extracts `title`, `detail`, `status`
- Handles plain Error objects
- Handles unknown types (fallback: "An unexpected error occurred")
- Export a convenience `getErrorMessage(error: unknown): string` that returns just the user-facing message

## Design Decisions
- No external toast library (react-hot-toast, sonner, etc.) -- keeps bundle small and matches existing pattern of custom UI components
- Zustand because the app already uses it for all global state
- Max 5 visible toasts; oldest dismissed when limit exceeded

## Success Criteria
- [ ] `useToastStore().addToast({ message, variant })` shows a toast in top-right
- [ ] Toast auto-dismisses after 5s
- [ ] Toast can be manually dismissed via X button
- [ ] `parseApiError` correctly extracts ProblemDetails fields
- [ ] Dark mode renders correctly
- [ ] No layout shift when toasts appear
