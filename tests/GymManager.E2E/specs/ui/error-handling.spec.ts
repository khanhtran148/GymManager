/**
 * E2E tests for HTTP error handling (Phase 4)
 *
 * Covers:
 *  - Static error pages /401, /403, /500 (content assertions)
 *  - 401 after a failed token refresh → redirects to /login
 *  - 403 API response → toast notification with "permission" text
 *  - 500 API response → toast notification with "went wrong" text
 *
 * Uses `page.route()` to intercept and mock API responses so the real
 * backend does not need to be running for error-scenario tests.
 */

import { test, expect } from "../../fixtures/auth.fixture.js";
import { ErrorPage } from "../../pages/error.page.js";

// ---------------------------------------------------------------------------
// Static error-page content
// ---------------------------------------------------------------------------

test.describe("Error pages render correctly", () => {
  test("401 page shows 'Session Expired' and a link to /login", async ({ page }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.goto(401);

    // Heading must mention "session expired"
    await expect(
      page.getByRole("heading").filter({ hasText: /session expired/i })
    ).toBeVisible({ timeout: 10_000 });

    // There must be a link (or button styled as a link) pointing to /login
    const loginLink = page
      .getByRole("link", { name: /go to login|login|sign in/i })
      .or(page.locator("a[href='/login']"));

    await expect(loginLink.first()).toBeVisible({ timeout: 10_000 });

    const href = await loginLink.first().getAttribute("href");
    expect(href).toMatch(/\/login/);
  });

  test("403 page shows 'Access Denied' or 'Forbidden' with Go Back and Go to Dashboard", async ({
    page,
  }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.goto(403);

    // Heading must mention "access denied" or "forbidden"
    await expect(
      page
        .getByRole("heading")
        .filter({ hasText: /access denied|forbidden/i })
    ).toBeVisible({ timeout: 10_000 });

    // "Go Back" — may be a button or a link
    const goBack = page
      .getByRole("button", { name: /go back/i })
      .or(page.getByRole("link", { name: /go back/i }));
    await expect(goBack.first()).toBeVisible({ timeout: 10_000 });

    // "Go to Dashboard" link
    const dashboardLink = page
      .getByRole("link", { name: /go to dashboard|dashboard/i })
      .or(page.locator("a[href='/']"));
    await expect(dashboardLink.first()).toBeVisible({ timeout: 10_000 });
  });

  test("500 page shows 'Something Went Wrong' with Try Again and Go Home", async ({
    page,
  }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.goto(500);

    // Heading must mention "something went wrong"
    await expect(
      page
        .getByRole("heading")
        .filter({ hasText: /something went wrong/i })
    ).toBeVisible({ timeout: 10_000 });

    // "Try Again" — may be a button or a link
    const tryAgain = page
      .getByRole("button", { name: /try again/i })
      .or(page.getByRole("link", { name: /try again/i }));
    await expect(tryAgain.first()).toBeVisible({ timeout: 10_000 });

    // "Go Home" link
    const homeLink = page
      .getByRole("link", { name: /go home|home/i })
      .or(page.locator("a[href='/']"));
    await expect(homeLink.first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 401 after failed token refresh → redirect to /login
// ---------------------------------------------------------------------------

test.describe("Token refresh failure", () => {
  test("401 on a protected resource when refresh also fails redirects to /login", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Mock the members list endpoint to always return 401
    await page.route("**/api/v1/members**", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          type: "https://tools.ietf.org/html/rfc7235#section-3.1",
          title: "Unauthorized",
          status: 401,
        }),
      })
    );

    // Mock the token-refresh endpoint to also return 401 (refresh token expired)
    await page.route("**/api/v1/auth/refresh**", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          type: "https://tools.ietf.org/html/rfc7235#section-3.1",
          title: "Unauthorized",
          status: 401,
        }),
      })
    );

    // Navigate to the members page — should trigger the intercepted 401
    await page.goto("/members");

    // The app should redirect to /login when it cannot refresh the token
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    expect(page.url()).toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// Toast notifications on API errors
// ---------------------------------------------------------------------------

test.describe("API error toast notifications", () => {
  test("403 API error shows a toast containing 'permission'", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Intercept any call to the members endpoint and respond with 403
    await page.route("**/api/v1/members**", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          type: "https://tools.ietf.org/html/rfc7231#section-6.5.3",
          title: "Forbidden",
          status: 403,
          detail: "You do not have permission to access this resource.",
        }),
      })
    );

    // Navigating to /members triggers a GET /api/v1/members fetch
    await page.goto("/members");
    await page.waitForLoadState("domcontentloaded");

    // Toast element — common patterns for Sonner / shadcn toast / react-hot-toast
    const toast = page
      .getByRole("alert")
      .filter({ hasText: /permission/i })
      .or(page.locator("[data-sonner-toast]").filter({ hasText: /permission/i }))
      .or(page.locator("[data-testid='toast']").filter({ hasText: /permission/i }))
      .or(
        page
          .locator("[role='status'], [aria-live='polite'], [aria-live='assertive']")
          .filter({ hasText: /permission/i })
      );

    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
  });

  test("500 API error shows a toast containing 'went wrong'", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Intercept any call to the members endpoint and respond with 500
    await page.route("**/api/v1/members**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          type: "https://tools.ietf.org/html/rfc7231#section-6.6.1",
          title: "An error occurred while processing your request.",
          status: 500,
        }),
      })
    );

    // Navigating to /members triggers a GET /api/v1/members fetch
    await page.goto("/members");
    await page.waitForLoadState("domcontentloaded");

    // Toast element — common patterns for Sonner / shadcn toast / react-hot-toast
    const toast = page
      .getByRole("alert")
      .filter({ hasText: /went wrong/i })
      .or(page.locator("[data-sonner-toast]").filter({ hasText: /went wrong/i }))
      .or(page.locator("[data-testid='toast']").filter({ hasText: /went wrong/i }))
      .or(
        page
          .locator("[role='status'], [aria-live='polite'], [aria-live='assertive']")
          .filter({ hasText: /went wrong/i })
      );

    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
  });
});
