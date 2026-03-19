import { type Page, type Locator } from "@playwright/test";

export class StaffPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;
  readonly staffTypeFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").filter({ hasText: /staff/i });
    this.createButton = page.getByRole("link", { name: /new staff|add staff|create staff/i })
      .or(page.getByRole("button", { name: /^(new|create|add)$/i }));
    this.tableRows = page.locator("table tbody tr, [role='row']:not(:first-child)");
    this.staffTypeFilter = page.getByLabel(/staff type|type/i)
      .or(page.getByRole("combobox", { name: /type/i }));
  }

  async goto() {
    await this.page.goto("/staff");
  }

  async getRows() {
    return this.tableRows.all();
  }

  async rowByText(text: string) {
    return this.tableRows.filter({ hasText: text });
  }
}

export class StaffFormPage {
  readonly page: Page;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole("button", { name: /^(create|save|submit|add)$/i });
    this.errorAlert = page.getByRole("alert")
      .or(page.getByTestId("error-message"));
  }

  async goto() {
    await this.page.goto("/staff/new");
  }

  async getErrorMessage(): Promise<string | null> {
    const alert = this.errorAlert.first();
    if (await alert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return alert.textContent();
    }
    return null;
  }
}
