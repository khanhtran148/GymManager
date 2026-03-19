/**
 * Page Object for error pages: /401, /403, /500
 *
 * Provides stable locators for the key UI elements on each error page
 * (heading, description, primary action, secondary action) so tests are
 * resilient to CSS class changes.
 */

import { Page, Locator } from "@playwright/test";

export class ErrorPage {
  // -- Locators -------------------------------------------------------------

  /**
   * Status code display — usually a large numeric element rendered on the page.
   * Tries data-testid first then falls back to heading-like content.
   */
  readonly statusCode: Locator;

  /**
   * Main heading of the error page (e.g. "Session Expired", "Access Denied",
   * "Something Went Wrong").
   */
  readonly heading: Locator;

  /**
   * Descriptive paragraph below the heading.
   */
  readonly description: Locator;

  /**
   * Primary call-to-action button (e.g. "Go to Login", "Go Back", "Try Again").
   */
  readonly primaryAction: Locator;

  /**
   * Secondary call-to-action link (e.g. "Go to Dashboard", "Go Home").
   */
  readonly secondaryAction: Locator;

  constructor(readonly page: Page) {
    this.statusCode = page
      .getByTestId("error-status-code")
      .or(page.locator("[data-testid='status-code']"))
      .or(page.locator("h1, h2, span, p").filter({ hasText: /^(401|403|500)$/ }).first());

    this.heading = page
      .getByTestId("error-heading")
      .or(page.getByRole("heading").filter({ hasText: /session expired|access denied|forbidden|something went wrong/i }).first())
      .or(page.locator("h1, h2").first());

    this.description = page
      .getByTestId("error-description")
      .or(page.locator("p").filter({ hasText: /.{10,}/ }).first());

    this.primaryAction = page
      .getByTestId("error-primary-action")
      .or(page.getByRole("button", { name: /go to login|go back|try again/i }).first())
      .or(page.getByRole("link", { name: /go to login|go back|try again/i }).first());

    this.secondaryAction = page
      .getByTestId("error-secondary-action")
      .or(page.getByRole("link", { name: /go to dashboard|go home/i }).first())
      .or(page.getByRole("button", { name: /go to dashboard|go home/i }).first());
  }

  // -- Navigation -----------------------------------------------------------

  /**
   * Navigate directly to the given error page.
   *
   * @param code - The HTTP error code to navigate to.
   */
  async goto(code: 401 | 403 | 500): Promise<void> {
    await this.page.goto(`/${code}`);
    await this.page.waitForLoadState("domcontentloaded");
  }
}
