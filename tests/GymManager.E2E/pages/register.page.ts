/**
 * Page Object for /register
 *
 * Covers the registration form with fullName, email, password,
 * confirmPassword, and optional phone fields.
 */

import { Page, Locator } from "@playwright/test";

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export class RegisterPage {
  // -- Locators -------------------------------------------------------------

  /** Full name text input */
  readonly fullNameInput: Locator;

  /** Email text input */
  readonly emailInput: Locator;

  /** Password text input (matches "Password" label, not "Confirm Password") */
  readonly passwordInput: Locator;

  /** Confirm password text input */
  readonly confirmPasswordInput: Locator;

  /** Optional phone number input */
  readonly phoneInput: Locator;

  /** Primary register / create account button */
  readonly submitButton: Locator;

  /** Error alert for form-level or API errors */
  readonly errorAlert: Locator;

  /** Link back to /login */
  readonly loginLink: Locator;

  constructor(private readonly page: Page) {
    this.fullNameInput = page
      .getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i));

    this.emailInput = page
      .getByLabel(/^email/i)
      .or(page.getByPlaceholder(/^email/i));

    // Use exact=false so "Password" matches but not "Confirm Password"
    this.passwordInput = page
      .getByLabel(/^password$/i)
      .or(page.getByPlaceholder(/^password$/i))
      // Fallback: first password-type input
      .or(page.locator('input[type="password"]').first());

    this.confirmPasswordInput = page
      .getByLabel(/confirm password/i)
      .or(page.getByPlaceholder(/confirm password/i))
      .or(page.locator('input[type="password"]').nth(1));

    this.phoneInput = page
      .getByLabel(/phone/i)
      .or(page.getByPlaceholder(/phone/i));

    this.submitButton = page.getByRole("button", {
      name: /^(register|sign up|create account|create)$/i,
    });

    this.errorAlert = page
      .getByRole("alert")
      .or(page.getByTestId("error-message"))
      .or(page.locator("[data-testid='register-error'], .error-message"));

    this.loginLink = page.getByRole("link", { name: /login|sign in/i });
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate to /register */
  async goto(): Promise<void> {
    await this.page.goto("/register");
    await this.page.waitForLoadState("domcontentloaded");
  }

  // -- Actions --------------------------------------------------------------

  /**
   * Fill every form field. `phone` is optional — it is skipped when absent.
   * Matches the RegisterRequest shape (email, password, fullName, phone?).
   */
  async fillForm(data: RegisterFormData): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    if (data.phone !== undefined) {
      await this.phoneInput.fill(data.phone);
    }
  }

  /** Click the submit button */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Convenience: fill the form and submit in one call.
   * Does NOT wait for navigation — caller should await URL change.
   */
  async fillAndSubmit(data: RegisterFormData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  // -- Assertions -----------------------------------------------------------

  /**
   * Returns the visible error message text, or null if no error is shown.
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

  /** Wait until the browser navigates away from /register (registration succeeded) */
  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 15_000,
    });
  }
}
