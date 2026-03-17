/**
 * Page Objects for /members (list) and /members/new (creation form).
 *
 * MembersPage     — wraps the paginated member list / search view
 * MemberFormPage  — wraps the create member form
 *
 * API route: POST /gymhouses/{gymHouseId}/members
 * UI routes: /members, /members/new
 *
 * The members list is scoped to a gym house in the UI (usually via a
 * query param or routing context) but the PO interacts with whatever is
 * currently rendered.
 */

import { Page, Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Form data shape — matches CreateMemberRequest from the API contract
// ---------------------------------------------------------------------------

export interface MemberFormData {
  fullName: string;
  email: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// MembersPage — list view at /members
// ---------------------------------------------------------------------------

export class MembersPage {
  // -- Locators -------------------------------------------------------------

  /** Page heading */
  readonly heading: Locator;

  /**
   * "New Member" / "Add Member" button or link that navigates to /members/new.
   */
  readonly createButton: Locator;

  /**
   * All data rows in the members table (excludes the header row).
   */
  readonly tableRows: Locator;

  /**
   * Search input — used to filter members by name, email, or member code.
   */
  readonly searchInput: Locator;

  /** "Next page" pagination control */
  readonly paginationNext: Locator;

  /** "Previous page" pagination control */
  readonly paginationPrev: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: /member/i });

    this.createButton = page
      .getByRole("link", { name: /new member|add member|create member/i })
      .or(page.getByRole("button", { name: /new member|add member|create member/i }))
      .or(page.getByRole("link", { name: /^(new|create|add)$/i }))
      .or(page.getByRole("button", { name: /^(new|create|add)$/i }));

    this.tableRows = page
      .getByRole("row")
      .filter({ hasNot: page.getByRole("columnheader") });

    this.searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search member|search/i))
      .or(page.getByLabel(/search/i));

    this.paginationNext = page
      .getByRole("button", { name: /^next$/i })
      .or(page.getByLabel(/next page/i))
      .or(page.getByTestId("pagination-next"));

    this.paginationPrev = page
      .getByRole("button", { name: /^(previous|prev)$/i })
      .or(page.getByLabel(/previous page/i))
      .or(page.getByTestId("pagination-prev"));
  }

  // -- Navigation -----------------------------------------------------------

  /**
   * Navigate to /members (default list with no gym-house filter).
   * In production the UI may require a gymHouseId query param; override the
   * path if needed: `await page.goto("/members?gymHouseId=...")`.
   */
  async goto(): Promise<void> {
    await this.page.goto("/members");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Click the create button and wait for navigation to /members/new */
  async gotoNew(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForURL(/\/members\/new/);
  }

  /**
   * Alias for `gotoNew()` — matches the method name used in existing specs.
   * @deprecated Prefer `gotoNew()`.
   */
  async clickCreate(): Promise<void> {
    return this.gotoNew();
  }

  // -- Data helpers ---------------------------------------------------------

  /**
   * Returns all data rows as a Locator array.
   */
  async getRows(): Promise<Locator[]> {
    return this.tableRows.all();
  }

  /**
   * Returns the row containing the given text (name, email, or member code).
   */
  rowByText(text: string): Locator {
    return this.page.getByRole("row").filter({ hasText: text });
  }

  /**
   * Click the link inside the row matching `text` to navigate to the member
   * detail page.
   */
  async clickRow(text: string): Promise<void> {
    await this.rowByText(text).getByRole("link").first().click();
  }

  // -- Search ---------------------------------------------------------------

  /**
   * Type a search term into the search input and wait for the list to update.
   * Presses Enter to trigger immediate search (bypasses debounce).
   */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.page.keyboard.press("Enter");
    await this.page.waitForLoadState("domcontentloaded");
  }

  // -- Assertions -----------------------------------------------------------

  /**
   * Returns the error alert text if visible, otherwise null.
   */
  async getErrorMessage(): Promise<string | null> {
    const alert = this.page.getByRole("alert").first();
    try {
      if (!(await alert.isVisible())) return null;
      return alert.textContent();
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// MemberFormPage — creation form at /members/new
// ---------------------------------------------------------------------------

export class MemberFormPage {
  // -- Locators -------------------------------------------------------------

  /** Full name text input */
  readonly fullNameInput: Locator;

  /** Email text input */
  readonly emailInput: Locator;

  /** Optional phone input */
  readonly phoneInput: Locator;

  /** Primary submit button */
  readonly submitButton: Locator;

  /** Form-level error alert */
  readonly errorAlert: Locator;

  /** Any field currently in an invalid / error state */
  readonly invalidFields: Locator;

  constructor(private readonly page: Page) {
    this.fullNameInput = page
      .getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i));

    this.emailInput = page
      .getByLabel(/^email/i)
      .or(page.getByPlaceholder(/^email/i));

    this.phoneInput = page
      .getByLabel(/phone/i)
      .or(page.getByPlaceholder(/phone/i));

    this.submitButton = page.getByRole("button", {
      name: /^(save|create|submit|add member|create member)$/i,
    });

    this.errorAlert = page
      .getByRole("alert")
      .or(page.getByTestId("form-error"))
      .first();

    this.invalidFields = page.locator("[aria-invalid='true']");
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate directly to /members/new */
  async goto(): Promise<void> {
    await this.page.goto("/members/new");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Alias for `goto()` — matches the method name used in existing specs.
   * @deprecated Prefer `goto()`.
   */
  async gotoNew(): Promise<void> {
    return this.goto();
  }

  // -- Actions --------------------------------------------------------------

  /**
   * Fill the member creation form.
   * Matches CreateMemberRequest: { email, fullName, phone? }
   * `phone` is optional and skipped when undefined.
   */
  async fillForm(data: MemberFormData): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    if (data.phone !== undefined) {
      await this.phoneInput.fill(data.phone);
    }
  }

  /**
   * Alias for `fillForm()` — matches the method name used in existing specs.
   * Accepts extra fields (`gymHouseId`, `gymHouseName`, `dateOfBirth`) which
   * are not part of the API contract but were in the old stub. They are
   * silently ignored; the caller must pass gymHouseId via the URL or app state.
   * @deprecated Prefer `fillForm()`.
   */
  async fill(
    data: MemberFormData & {
      gymHouseId?: string;
      gymHouseName?: string;
      dateOfBirth?: string;
    },
  ): Promise<void> {
    const { gymHouseId: _1, gymHouseName: _2, dateOfBirth: _3, ...rest } = data;
    return this.fillForm(rest);
  }

  /** Click the submit button */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill the form and submit in one call.
   * Caller should await URL change after this resolves.
   */
  async fillAndSubmit(data: MemberFormData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  // -- Assertions -----------------------------------------------------------

  /**
   * Returns the form-level error message text, or null if none is visible.
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      if (!(await this.errorAlert.isVisible())) return null;
      return this.errorAlert.textContent();
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// MemberDetailPage — member detail view at /members/{id}
// ---------------------------------------------------------------------------

/**
 * Page Object for the member detail page (/members/{memberId}).
 * Shows full member info, subscription history, and action buttons.
 */
export class MemberDetailPage {
  // -- Locators -------------------------------------------------------------

  /** Member full name — typically the page heading */
  readonly fullName: Locator;

  /** Member email address text */
  readonly email: Locator;

  /** Section containing the member's subscription list */
  readonly subscriptionsSection: Locator;

  /** Button or link to add a new subscription */
  readonly addSubscriptionButton: Locator;

  /** Edit member button / link */
  readonly editButton: Locator;

  constructor(private readonly page: Page) {
    this.fullName = page
      .getByTestId("member-name")
      .or(page.locator("h1").first())
      .or(page.locator("h2").first());

    this.email = page
      .getByTestId("member-email")
      .or(page.locator("[data-testid='member-email']"))
      .or(page.getByText(/@/).first());

    this.subscriptionsSection = page
      .getByTestId("subscriptions")
      .or(
        page
          .locator("section, [data-testid]")
          .filter({ hasText: /subscription/i })
          .first(),
      );

    this.addSubscriptionButton = page
      .getByRole("link", { name: /add subscription|new subscription/i })
      .or(
        page.getByRole("button", {
          name: /add subscription|new subscription/i,
        }),
      );

    this.editButton = page
      .getByRole("button", { name: /^edit$/i })
      .or(page.getByRole("link", { name: /^edit$/i }));
  }

  // -- Navigation -----------------------------------------------------------

  /**
   * Navigate to the member detail page for the given memberId.
   * Waits for the page to finish loading.
   */
  async goto(memberId: string): Promise<void> {
    await this.page.goto(`/members/${memberId}`);
    await this.page.waitForLoadState("domcontentloaded");
  }
}
