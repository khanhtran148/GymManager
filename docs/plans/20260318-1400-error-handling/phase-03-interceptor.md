# Phase 3: Axios Interceptor + TanStack Query Error Handling

## Goal
Enhance the Axios response interceptor to show toasts for 403 and 500 errors. Configure TanStack Query's global error handler for mutations. Ensure query errors surface in components via existing `error` state.

## File Ownership
Owns:
- `src/apps/gymmanager-web/src/lib/api-client.ts` (MODIFY)
- `src/apps/gymmanager-web/src/providers/query-provider.tsx` (MODIFY)

Must not touch: error pages, toast system internals, E2E tests, hooks (hooks already return error state)

## Implementation Steps

### 1. Enhance Axios Interceptor (`src/lib/api-client.ts`)

Add handling for 403 and 500 after the existing 401 block. The interceptor currently only handles 401; all other errors fall through to `Promise.reject(error)`.

**After the 401 block (line 116), before the final `return Promise.reject(error)`:**

```typescript
// 403 -- toast; do NOT redirect (let the component decide)
if (error.response?.status === 403) {
  if (typeof window !== "undefined") {
    const { useToastStore } = await import("@/stores/toast-store");
    useToastStore.getState().addToast({
      message: "You don't have permission for this action.",
      variant: "error",
    });
  }
  return Promise.reject(error);
}

// 500+ -- toast for server errors
if (error.response?.status && error.response.status >= 500) {
  if (typeof window !== "undefined") {
    const { useToastStore } = await import("@/stores/toast-store");
    useToastStore.getState().addToast({
      message: "Something went wrong. Please try again later.",
      variant: "error",
    });
  }
  return Promise.reject(error);
}
```

**Key decisions:**
- Dynamic `import()` to avoid circular dependency (api-client is imported everywhere)
- 403 shows toast only, no redirect -- the middleware already handles route-level 403 redirects; API-level 403 is for individual actions (e.g., trying to delete without permission)
- 500 toast covers all 5xx status codes
- The error still rejects so TanStack Query / caller can handle it too

### 2. Update 401 Handling (minor tweak)
The existing 401 handler already redirects to `/login` when refresh fails. Add `useAuthStore.getState().logout()` call before the redirect to properly clear Zustand state and cookies (currently it only clears localStorage directly).

Replace lines 106-112 in the catch block:
```typescript
} catch (refreshError) {
  processQueue(refreshError, null);
  useAuthStore.getState().logout();  // clears localStorage, cookies, Zustand state
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  return Promise.reject(refreshError);
}
```
This removes the manual `localStorage.removeItem` calls (redundant since `logout()` does them).

### 3. Global Mutation Error Handler (`src/providers/query-provider.tsx`)

Add a default `onError` for mutations that shows a toast with the parsed error message:

```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
        },
        mutations: {
          onError: (error) => {
            // Only show toast if the interceptor hasn't already (skip 403, 500)
            const status = (error as any)?.response?.status;
            if (status === 403 || (status && status >= 500)) return;
            const { useToastStore } = require("@/stores/toast-store");
            const message = getErrorMessage(error);
            useToastStore.getState().addToast({
              message,
              variant: "error",
            });
          },
        },
      },
    })
);
```

**Note:** This catches mutation errors like 400 (validation) and 404 that the interceptor doesn't toast. The interceptor already toasts 403 and 500, so we skip those to avoid double-toasting.

### 4. Query Error Handling -- No Changes Needed
TanStack Query hooks already return `{ error }`. Pages already check `if (error)` and render `<Alert>`. This is sufficient for inline error states. No global query `onError` is needed -- let each page decide how to render query failures.

## Design Decisions
- Interceptor toasts 403 and 500; global mutation `onError` toasts other errors. This avoids double-toasting.
- No redirect to `/500` page on API 500 errors. The toast is less disruptive. The `/500` page exists for cases where the app itself crashes (e.g., a Next.js server error during SSR).
- The `logout()` call in the 401 catch block ensures cookies and Zustand are properly cleared, not just localStorage.

## Success Criteria
- [ ] 403 API response shows error toast, does not redirect
- [ ] 500 API response shows error toast, does not redirect
- [ ] 401 with failed refresh calls `logout()` then redirects to `/login`
- [ ] Mutation errors (400, 404, 409) show toast with parsed ProblemDetails message
- [ ] No double-toasting on 403 or 500 errors
- [ ] Query errors still render inline via `<Alert>` in components
