import { type Page, type Locator } from "@playwright/test";

export class AnnouncementsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").filter({ hasText: /announcement/i });
    this.createButton = page.getByRole("link", { name: /new announcement|create announcement/i })
      .or(page.getByRole("button", { name: /^(new|create|add)$/i }));
    this.tableRows = page.locator("table tbody tr, [role='row']:not(:first-child)");
  }

  async goto() {
    await this.page.goto("/announcements");
  }

  async getRows() {
    return this.tableRows.all();
  }

  async rowByText(text: string) {
    return this.tableRows.filter({ hasText: text });
  }
}

export class AnnouncementFormPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i));
    this.contentInput = page.getByLabel(/content|message/i)
      .or(page.getByPlaceholder(/content|message/i));
    this.submitButton = page.getByRole("button", { name: /^(create|publish|save|submit)$/i });
    this.errorAlert = page.getByRole("alert")
      .or(page.getByTestId("error-message"));
  }

  async goto() {
    await this.page.goto("/announcements/new");
  }

  async getErrorMessage(): Promise<string | null> {
    const alert = this.errorAlert.first();
    if (await alert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return alert.textContent();
    }
    return null;
  }
}
