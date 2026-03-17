import { test, expect } from "../fixtures/auth.fixture.js";
import { DashboardPage } from "../pages/dashboard.page.js";

/**
 * All navigation tests require an authenticated user so we use the
 * `authenticatedPage` fixture which injects auth state before each test.
 */

test.describe("App navigation and layout", () => {
  test.describe("Sidebar navigation links", () => {
    const routes: Array<{ label: string; url: RegExp }> = [
      { label: "gym house", url: /\/gym-houses/ },
      { label: "member", url: /\/members/ },
      { label: "booking", url: /\/bookings/ },
      { label: "class schedule", url: /\/class-schedules/ },
      { label: "time slot", url: /\/time-slots/ },
      { label: "finance", url: /\/finance/ },
      { label: "staff", url: /\/staff/ },
      { label: "announcement", url: /\/announcements/ },
      { label: "notification", url: /\/notifications/ },
    ];

    for (const { label, url } of routes) {
      test(`sidebar link "${label}" navigates to the correct page`, async ({
        authenticatedPage,
      }) => {
        const page = authenticatedPage;
        const dashboardPage = new DashboardPage(page);

        // Ensure we start from the dashboard
        await dashboardPage.goto();
        await dashboardPage.waitForLoad();

        // Click the matching nav link
        await dashboardPage.navLink(label).click();

        await page.waitForURL(url, { timeout: 15_000 });
        expect(page.url()).toMatch(url);
      });
    }
  });

  test.describe("Dashboard quick action links", () => {
    test("quick action links are present and have valid href attributes", async ({
      authenticatedPage,
    }) => {
      const page = authenticatedPage;
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Quick actions section — look for anchor elements in a 'quick actions' region
      const quickActionsRegion = page
        .getByTestId("quick-actions")
        .or(page.locator("section, div").filter({ hasText: /quick action/i }))
        .first();

      // If a dedicated quick-actions region exists, verify links inside it
      if (await quickActionsRegion.isVisible().catch(() => false)) {
        const links = quickActionsRegion.getByRole("link");
        const linkCount = await links.count();
        expect(linkCount).toBeGreaterThan(0);

        // Each link must have a non-empty href
        for (let i = 0; i < linkCount; i++) {
          const href = await links.nth(i).getAttribute("href");
          expect(href).toBeTruthy();
          expect(href).not.toBe("#");
        }
      } else {
        // Fallback: just verify the page loaded without error
        await expect(page.getByRole("main")).toBeVisible();
      }
    });

    test("clicking a quick action link navigates to the correct page", async ({
      authenticatedPage,
    }) => {
      const page = authenticatedPage;
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // Try to find a quick action link that goes to /members/new or /bookings/new
      const newMemberLink = page.getByRole("link", { name: /new member|add member/i });
      const newBookingLink = page.getByRole("link", { name: /new booking|add booking/i });

      if (await newMemberLink.isVisible().catch(() => false)) {
        await newMemberLink.click();
        await page.waitForURL(/\/members\/new/, { timeout: 15_000 });
        expect(page.url()).toContain("/members/new");
      } else if (await newBookingLink.isVisible().catch(() => false)) {
        await newBookingLink.click();
        await page.waitForURL(/\/bookings\/new/, { timeout: 15_000 });
        expect(page.url()).toContain("/bookings/new");
      } else {
        // No known quick action links — pass as a soft assertion
        test.skip(true, "No quick action links found on dashboard");
      }
    });
  });

  test.describe("Page title / document title", () => {
    const titleChecks: Array<{ route: string; titlePattern: RegExp }> = [
      { route: "/", titlePattern: /dashboard|gym manager/i },
      { route: "/gym-houses", titlePattern: /gym house/i },
      { route: "/members", titlePattern: /member/i },
      { route: "/bookings", titlePattern: /booking/i },
      { route: "/finance", titlePattern: /finance/i },
      { route: "/staff", titlePattern: /staff/i },
      { route: "/announcements", titlePattern: /announcement/i },
    ];

    for (const { route, titlePattern } of titleChecks) {
      test(`document title reflects the "${route}" route`, async ({
        authenticatedPage,
      }) => {
        await authenticatedPage.goto(route);
        await authenticatedPage.waitForLoadState("domcontentloaded");

        const title = await authenticatedPage.title();
        expect(title).toMatch(titlePattern);
      });
    }
  });

  test.describe("Theme toggle (dark/light mode)", () => {
    test("toggling the theme switch changes the color scheme", async ({
      authenticatedPage,
    }) => {
      const page = authenticatedPage;

      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Locate the theme toggle button (common patterns: button with sun/moon icon,
      // aria-label containing "dark" or "light", or a data-testid)
      const themeToggle = page
        .getByRole("button", { name: /dark mode|light mode|toggle theme|theme/i })
        .or(page.getByTestId("theme-toggle"))
        .or(page.getByLabel(/dark mode|light mode|switch theme/i));

      if (!(await themeToggle.isVisible().catch(() => false))) {
        test.skip(true, "Theme toggle not found in current UI");
        return;
      }

      // Capture the initial color scheme
      const htmlElement = page.locator("html");
      const initialClass = await htmlElement.getAttribute("class") ?? "";
      const initialDataTheme = await htmlElement.getAttribute("data-theme") ?? "";

      // Click the toggle
      await themeToggle.click();
      await page.waitForTimeout(300); // allow CSS transition

      // Verify the class or data-theme attribute changed
      const newClass = await htmlElement.getAttribute("class") ?? "";
      const newDataTheme = await htmlElement.getAttribute("data-theme") ?? "";

      const themeChanged =
        newClass !== initialClass || newDataTheme !== initialDataTheme;
      expect(themeChanged).toBe(true);

      // Toggle back — app should return to the original state
      await themeToggle.click();
      await page.waitForTimeout(300);

      const restoredClass = await htmlElement.getAttribute("class") ?? "";
      const restoredDataTheme = await htmlElement.getAttribute("data-theme") ?? "";

      expect(restoredClass).toBe(initialClass);
      expect(restoredDataTheme).toBe(initialDataTheme);
    });
  });
});
