import { type Page, type Locator } from "@playwright/test";

export class TransactionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;
  readonly categoryFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").filter({ hasText: /transaction|finance/i });
    this.createButton = page.getByRole("link", { name: /new transaction|add transaction|record/i })
      .or(page.getByRole("button", { name: /^(new|create|add|record)$/i }));
    this.tableRows = page.locator("table tbody tr, [role='row']:not(:first-child)");
    this.categoryFilter = page.getByLabel(/category/i)
      .or(page.getByRole("combobox", { name: /category/i }));
  }

  async goto() {
    await this.page.goto("/finance/transactions");
  }

  async getRows() {
    return this.tableRows.all();
  }
}

export class TransactionFormPage {
  readonly page: Page;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole("button", { name: /^(record|save|submit|create)$/i });
    this.errorAlert = page.getByRole("alert")
      .or(page.getByTestId("error-message"));
  }

  async goto() {
    await this.page.goto("/finance/transactions/new");
  }

  async getErrorMessage(): Promise<string | null> {
    const alert = this.errorAlert.first();
    if (await alert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return alert.textContent();
    }
    return null;
  }
}
