import { test, expect } from "../../fixtures/auth.fixture.js";
import { RegisterPage } from "../../pages/register.page.js";
import { LoginPage } from "../../pages/login.page.js";
import { DashboardPage } from "../../pages/dashboard.page.js";
import { generateUser } from "../../helpers/test-data.js";
import { register } from "../../helpers/api-client.js";

test.describe("Authentication flows", () => {
  test.describe("Registration", () => {
    test("register with valid data redirects to dashboard and shows full name", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      const user = generateUser();

      await registerPage.goto();
      await registerPage.fillAndSubmit({
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        confirmPassword: user.confirmPassword,
      });

      await page.waitForURL((url) => !url.pathname.includes("/register"), {
        timeout: 15_000,
      });

      expect(page.url()).not.toContain("/register");

      // Greeting must contain the user's full name
      await expect(page.getByText(user.fullName, { exact: false })).toBeVisible({
        timeout: 15_000,
      });
    });

    test("register with duplicate email shows a server error", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const user = generateUser();

      // Pre-create the user via API so the email already exists
      await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });

      await registerPage.goto();
      await registerPage.fillAndSubmit({
        fullName: "Another User",
        email: user.email,
        password: user.password,
        confirmPassword: user.confirmPassword,
      });

      await expect(registerPage.errorAlert.first()).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("alert").filter({ hasText: /email|already|exist|taken|conflict/i })
      ).toBeVisible();
    });

    test("register with mismatched passwords shows a validation error", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      const user = generateUser();

      await registerPage.goto();
      await registerPage.fillAndSubmit({
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        confirmPassword: "WrongPassword999!",
      });

      await expect(registerPage.errorAlert.first()).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("alert").filter({ hasText: /password|match|confirm/i })
      ).toBeVisible();
    });
  });

  test.describe("Login", () => {
    test("login with valid credentials redirects to dashboard", async ({
      page,
      authResponse,
    }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(authResponse.email, "Test@1234");

      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 15_000,
      });
      expect(page.url()).not.toContain("/login");
    });

    test("login with wrong password shows an error message", async ({
      page,
      authResponse,
    }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(authResponse.email, "WrongPassword999!");

      await expect(page).toHaveURL(/\/login/);
      await expect(loginPage.errorAlert.first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Route guards", () => {
    test("unauthenticated user visiting / is redirected to /login", async ({
      page,
    }) => {
      // Clear all stored auth state for this browser context
      await page.goto("/login");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();

      await page.goto("/");
      await page.waitForURL(/\/login/, { timeout: 15_000 });
      expect(page.url()).toContain("/login");
    });

    test("authenticated user visiting /login is redirected to dashboard", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/login");
      await authenticatedPage.waitForURL(
        (url) => !url.pathname.includes("/login"),
        { timeout: 15_000 }
      );
      expect(authenticatedPage.url()).not.toContain("/login");
    });
  });

  test.describe("Logout", () => {
    test("logout clears session and redirects to /login, then visiting / also redirects to /login", async ({
      authenticatedPage,
    }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);
      await dashboardPage.logout();

      await authenticatedPage.waitForURL(/\/login/, { timeout: 15_000 });
      expect(authenticatedPage.url()).toContain("/login");

      // Clear any remaining storage to simulate a clean browser state
      await authenticatedPage.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await authenticatedPage.goto("/");
      await authenticatedPage.waitForURL(/\/login/, { timeout: 15_000 });
      expect(authenticatedPage.url()).toContain("/login");
    });
  });
});
