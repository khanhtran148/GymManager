import { type Page, type Locator } from "@playwright/test";

export class BookingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly tableRows: Locator;
  readonly dateFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").filter({ hasText: /booking/i });
    this.createButton = page.getByRole("link", { name: /new booking|add booking|create booking/i })
      .or(page.getByRole("button", { name: /^(new|create|add)$/i }));
    this.tableRows = page.locator("table tbody tr, [role='row']:not(:first-child)");
    this.dateFilter = page.getByLabel(/date/i).or(page.getByPlaceholder(/date/i));
  }

  async goto() {
    await this.page.goto("/bookings");
  }

  async getRows() {
    return this.tableRows.all();
  }

  async rowByText(text: string) {
    return this.tableRows.filter({ hasText: text });
  }
}

export class BookingDetailPage {
  readonly page: Page;
  readonly cancelButton: Locator;
  readonly checkInButton: Locator;
  readonly noShowButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.checkInButton = page.getByRole("button", { name: /check.?in/i });
    this.noShowButton = page.getByRole("button", { name: /no.?show/i });
    this.statusBadge = page.getByTestId("booking-status")
      .or(page.locator("[class*='badge'], [class*='status']").first());
  }

  async goto(bookingId: string) {
    await this.page.goto(`/bookings/${bookingId}`);
  }
}
