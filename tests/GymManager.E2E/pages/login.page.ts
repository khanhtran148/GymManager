/**
 * Page Object for /login
 *
 * Locators use accessible attributes (role + name, label) so tests are
 * resilient to CSS class changes. The exact label/placeholder text may need
 * adjusting once the real frontend is rendered.
 */

import { Page, Locator } from "@playwright/test";

export class LoginPage {
  // -- Locators -------------------------------------------------------------

  /** Email address text input */
  readonly emailInput: Locator;

  /** Password text input (matches "Password" label, not "Confirm Password") */
  readonly passwordInput: Locator;

  /** Primary submit / sign-in button */
  readonly submitButton: Locator;

  /**
   * Error alert displayed on login failure (e.g. invalid credentials,
   * validation error). Matches both role="alert" and common error patterns.
   */
  readonly errorAlert: Locator;

  /** Link to the /register page */
  readonly registerLink: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page
      .getByLabel(/^email/i)
      .or(page.getByPlaceholder(/email/i));

    this.passwordInput = page
      .getByLabel(/^password/i)
      .or(page.getByPlaceholder(/^password/i));

    this.submitButton = page.getByRole("button", {
      name: /^(login|sign in|log in)$/i,
    });

    this.errorAlert = page
      .getByRole("alert")
      .or(page.getByTestId("error-message"))
      .or(page.locator("[data-testid='login-error'], .error-message"));

    this.registerLink = page.getByRole("link", {
      name: /register|sign up|create account/i,
    });
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate to /login */
  async goto(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
  }

  // -- Actions --------------------------------------------------------------

  /** Fill the email field */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Fill the password field */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Click the submit button */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Convenience method: fill both fields and submit.
   * Does NOT wait for navigation — caller should await URL change.
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // -- Assertions -----------------------------------------------------------

  /**
   * Returns the visible error message text, or null if no error is displayed.
   * Tests should prefer `.toBeVisible()` on `errorAlert` for assertion clarity.
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const visible = await this.errorAlert.isVisible();
      if (!visible) return null;
      return await this.errorAlert.textContent();
    } catch {
      return null;
    }
  }

  /** Wait until the browser navigates away from /login (login succeeded) */
  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15_000,
    });
  }
}
