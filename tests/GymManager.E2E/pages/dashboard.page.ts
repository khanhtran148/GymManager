/**
 * Page Object for / (dashboard / home page after login)
 *
 * The dashboard displays a welcome greeting, summary stat cards, and
 * navigation. This PO provides stable locators and helper methods that
 * survive minor UI layout changes.
 */

import { Page, Locator } from "@playwright/test";

export class DashboardPage {
  // -- Locators -------------------------------------------------------------

  /**
   * Welcome/greeting card or heading.
   * Tries data-testid first, then any h1/h2 that contains common greeting words.
   */
  readonly greeting: Locator;

  /**
   * The primary navigation sidebar (or top nav bar).
   * Used to drive navigation links.
   */
  readonly nav: Locator;

  /**
   * Container that holds all stat/metric cards.
   * Falls back to any element whose text contains "member" or "booking".
   */
  readonly statsSection: Locator;

  /**
   * Logout button — may live behind a user-menu dropdown.
   */
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.greeting = page
      .getByTestId("greeting")
      .or(page.getByTestId("welcome-card"))
      .or(page.locator("h1, h2").filter({ hasText: /welcome|hello|hi|dashboard/i }).first());

    this.nav = page
      .getByRole("navigation")
      .first();

    this.statsSection = page
      .getByTestId("stats")
      .or(page.getByTestId("dashboard-stats"))
      .or(page.locator("[aria-label*='statistics'], [aria-label*='stats']"))
      .or(page.locator(".stats, .stat-cards, [data-testid='stats']"))
      .first();

    this.logoutButton = page
      .getByRole("menuitem", { name: /sign out|logout|log out/i })
      .or(page.getByRole("button", { name: /^(logout|sign out|log out)$/i }));
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate to the root (redirects to /dashboard if not authenticated) */
  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Wait for dashboard data to finish loading */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  // -- Assertions -----------------------------------------------------------

  /**
   * Returns the text content of the greeting/welcome element, or null.
   * Useful for asserting the user's name is shown after login.
   */
  async getGreeting(): Promise<string | null> {
    try {
      const visible = await this.greeting.isVisible();
      if (!visible) return null;
      return await this.greeting.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Returns the numeric text of a stat card identified by its label.
   * Looks for an element containing `label` text and returns the sibling/child
   * that looks like a number.
   *
   * @param label - e.g. "Active Members", "Total Bookings"
   * @returns The text content of the value element, or null if not found.
   *
   * @example
   *   const count = await dashboardPage.getStatValue("Active Members");
   *   expect(count).not.toBeNull();
   */
  async getStatValue(label: string): Promise<string | null> {
    // Prefer a dedicated data-testid
    const byTestId = this.page.getByTestId(`stat-${label.toLowerCase().replace(/\s+/g, "-")}`);
    if (await byTestId.isVisible().catch(() => false)) {
      return byTestId.textContent();
    }

    // Generic fallback: find card containing the label, return its number-like child
    const card = this.page
      .locator("[data-testid], .stat-card, .metric-card, .card")
      .filter({ hasText: label });

    if (!(await card.isVisible().catch(() => false))) return null;

    // The value is usually in a larger-font element within the card
    const value = card.locator("span, p, div, strong").filter({ hasText: /^\d/ }).first();
    return value.textContent().catch(() => null);
  }

  // -- Navigation helpers ---------------------------------------------------

  /** Return a nav link locator by display name */
  navLink(name: string): Locator {
    return this.nav.getByRole("link", { name: new RegExp(name, "i") });
  }

  /** Click a navigation link by display name */
  async clickNavLink(name: string): Promise<void> {
    await this.navLink(name).click();
  }

  // -- Auth actions ---------------------------------------------------------

  /**
   * Logout: opens user-menu if present, then clicks the logout button.
   */
  async logout(): Promise<void> {
    // The logout action is behind a user menu dropdown in the top bar.
    // The button has aria-label="User menu" and aria-haspopup="menu".
    const userMenu = this.page
      .getByRole("button", { name: /user menu/i })
      .or(this.page.getByRole("button", { name: /user|account|profile|avatar/i }))
      .or(this.page.getByTestId("user-menu"))
      .or(this.page.getByTestId("user-avatar"));

    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      // Wait for the dropdown menu to appear
      await this.page.waitForTimeout(300);
    }

    await this.logoutButton.click();
  }
}
