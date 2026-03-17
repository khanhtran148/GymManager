/**
 * Page Objects for /gym-houses (list) and /gym-houses/new (creation form).
 *
 * GymHousesPage  — wraps the list/table view
 * GymHouseFormPage — wraps the create/edit form
 *
 * API route: POST /gymhouses  (note: no hyphen in API path)
 * UI route:  /gym-houses      (kebab-case, matches Next.js convention)
 */

import { Page, Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Form data shape — matches CreateGymHouseRequest from the API contract
// ---------------------------------------------------------------------------

export interface GymHouseFormData {
  name: string;
  address: string;
  phone?: string;
  operatingHours?: string;
  hourlyCapacity: number | string;
}

// ---------------------------------------------------------------------------
// GymHousesPage — list view at /gym-houses
// ---------------------------------------------------------------------------

export class GymHousesPage {
  // -- Locators -------------------------------------------------------------

  /** Page heading */
  readonly heading: Locator;

  /**
   * "New" / "Create" button or link that navigates to /gym-houses/new.
   * Accepts both <button> and <a> elements.
   */
  readonly createButton: Locator;

  /**
   * All data rows in the gym houses table (excludes the header row).
   */
  readonly tableRows: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: /gym house/i });

    this.createButton = page
      .getByRole("link", { name: /add gym house/i })
      .first();

    // Data rows: every <tr> that is NOT a header row
    this.tableRows = page
      .getByRole("row")
      .filter({ hasNot: page.getByRole("columnheader") });
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate to /gym-houses and wait for the list to load */
  async goto(): Promise<void> {
    await this.page.goto("/gym-houses");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Click the create button and wait for navigation to /gym-houses/new */
  async gotoNew(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForURL(/\/gym-houses\/new/);
  }

  /**
   * Alias for `gotoNew()` — matches the method name used in existing specs.
   * @deprecated Prefer `gotoNew()` for consistency with other POs.
   */
  async clickCreate(): Promise<void> {
    return this.gotoNew();
  }

  // -- Data helpers ---------------------------------------------------------

  /**
   * Returns all data rows as a Locator array.
   * Useful for asserting row count: `expect(await page.getRows()).toHaveLength(n)`.
   */
  async getRows(): Promise<Locator[]> {
    return this.tableRows.all();
  }

  /**
   * Returns the row that contains the given text (e.g. gym house name).
   * Throws if no row is found.
   */
  rowByText(text: string): Locator {
    return this.page.getByRole("row").filter({ hasText: text });
  }

  /**
   * Click the first link inside the row matching `text` to navigate to the
   * gym house detail / edit page.
   */
  async clickRow(text: string): Promise<void> {
    await this.rowByText(text).getByRole("link").first().click();
  }

  /**
   * Click the delete button inside the row matching `text` and confirm the
   * confirmation dialog if one appears.
   */
  async deleteRow(text: string): Promise<void> {
    const row = this.rowByText(text);
    await row.getByRole("button", { name: /delete|remove/i }).click();

    // Confirm destructive action dialog if present
    const confirmButton = this.page.getByRole("button", {
      name: /confirm|yes|delete/i,
    });
    if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmButton.click();
    }
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
// GymHouseFormPage — creation form at /gym-houses/new
// ---------------------------------------------------------------------------

export class GymHouseFormPage {
  // -- Locators -------------------------------------------------------------

  /** Gym house name input */
  readonly nameInput: Locator;

  /** Address input */
  readonly addressInput: Locator;

  /** Optional phone input */
  readonly phoneInput: Locator;

  /** Optional operating hours input (e.g. "06:00-22:00") */
  readonly operatingHoursInput: Locator;

  /** Hourly capacity numeric input */
  readonly hourlyCapacityInput: Locator;

  /** Primary submit button */
  readonly submitButton: Locator;

  /**
   * Form-level error alert (API or validation error shown above / below the form).
   */
  readonly errorAlert: Locator;

  /**
   * Any field currently in an invalid / error state (aria-invalid="true").
   * Used by specs to assert validation errors are shown.
   * Also aliased as `fieldErrors` for backward compatibility.
   */
  readonly invalidFields: Locator;

  /**
   * Alias for `invalidFields` — matches the property name used in existing specs.
   * @deprecated Prefer `invalidFields`.
   */
  readonly fieldErrors: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page
      .getByLabel(/^name$/i)
      .or(page.getByLabel(/gym house name/i))
      .or(page.getByPlaceholder(/name/i).first());

    this.addressInput = page
      .getByLabel(/address/i)
      .or(page.getByPlaceholder(/address/i));

    this.phoneInput = page
      .getByLabel(/phone/i)
      .or(page.getByPlaceholder(/phone/i));

    this.operatingHoursInput = page
      .getByLabel(/operating hours/i)
      .or(page.getByPlaceholder(/operating hours/i));

    this.hourlyCapacityInput = page
      .getByLabel(/hourly capacity/i)
      .or(page.getByLabel(/capacity/i))
      .or(page.getByPlaceholder(/capacity/i));

    this.submitButton = page.getByRole("button", {
      name: /create gym house|save|submit/i,
    });

    this.errorAlert = page
      .getByRole("alert")
      .or(page.getByTestId("form-error"))
      .first();

    this.invalidFields = page.locator("[aria-invalid='true']");
    // fieldErrors is a named alias pointing at the same locator
    this.fieldErrors = this.invalidFields;
  }

  // -- Navigation -----------------------------------------------------------

  /** Navigate directly to /gym-houses/new */
  async goto(): Promise<void> {
    await this.page.goto("/gym-houses/new");
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
   * Fill all provided form fields.
   * Optional fields (phone, operatingHours) are skipped when undefined.
   */
  async fillForm(data: GymHouseFormData): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.addressInput.fill(data.address);

    if (data.phone !== undefined) {
      await this.phoneInput.fill(data.phone);
    }

    if (data.operatingHours !== undefined) {
      await this.operatingHoursInput.fill(data.operatingHours);
    }

    await this.hourlyCapacityInput.fill(String(data.hourlyCapacity));
  }

  /**
   * Alias for `fillForm()` — matches the method name used in existing specs.
   * Accepts an extra `email` field (from old stubs) which is silently ignored
   * because the API contract does not include email on GymHouse.
   * @deprecated Prefer `fillForm()`.
   */
  async fill(
    data: GymHouseFormData & { email?: string },
  ): Promise<void> {
    // Destructure to drop the legacy `email` field before delegating
    const { email: _ignored, ...rest } = data;
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
  async fillAndSubmit(data: GymHouseFormData): Promise<void> {
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
