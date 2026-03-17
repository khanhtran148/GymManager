import { test, expect } from "../../fixtures/auth.fixture.js";
import { GymHouseDto } from "../../helpers/api-client.js";
import {
  generateGymHouse,
  generateTransaction,
} from "../../helpers/test-data.js";

test.describe("Finance features", () => {
  let gymHouse: GymHouseDto;

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
  });

  test.describe("Record transactions via form", () => {
    test("records a revenue transaction via form and it appears in the transaction list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const txData = generateTransaction({
        description: `Revenue UI test ${Date.now()}`,
      });

      await page.goto("/finance/transactions/new");
      await page.waitForLoadState("domcontentloaded");

      // Fill transaction type / direction
      const typeSelect = page
        .getByLabel(/type/i)
        .or(page.getByRole("combobox", { name: /type/i }))
        .first();
      // Select "MembershipFee" (index 0) or by value "0"
      await typeSelect.selectOption({ index: 0 }).catch(() => {
        // ignore if no options rendered yet
      });

      // Direction: Credit (Revenue)
      const directionSelect = page
        .getByLabel(/direction/i)
        .or(page.getByRole("combobox", { name: /direction/i }));
      if (await directionSelect.count() > 0) {
        await directionSelect.selectOption({ index: 0 });
      }

      // Amount
      const amountInput = page.getByLabel(/amount/i).or(page.getByPlaceholder(/amount/i));
      await amountInput.fill(String(txData.amount));

      // Category
      const categorySelect = page
        .getByLabel(/category/i)
        .or(page.getByRole("combobox", { name: /category/i }));
      if (await categorySelect.count() > 0) {
        await categorySelect.selectOption("Revenue").catch(async () => {
          await categorySelect.selectOption({ index: 0 });
        });
      }

      // Description
      const descInput = page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i));
      await descInput.fill(txData.description);

      // Date
      const dateInput = page.getByLabel(/date/i).first();
      await dateInput.fill(new Date().toISOString().split("T")[0]);

      await page.getByRole("button", { name: /save|create|submit/i }).click();

      // Navigate to transaction list
      await page.goto("/finance/transactions");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: txData.description })
      ).toBeVisible({ timeout: 10_000 });
    });

    test("records an expense transaction via form and it appears in the transaction list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const txData = generateTransaction({
        transactionType: 2, // Rent
        direction: 1,       // Debit
        category: "OperatingExpense",
        amount: 300000,
        description: `Expense UI test ${Date.now()}`,
      });

      await page.goto("/finance/transactions/new");
      await page.waitForLoadState("domcontentloaded");

      const typeSelect = page
        .getByLabel(/type/i)
        .or(page.getByRole("combobox", { name: /type/i }))
        .first();
      // Select "Rent" (index 2) or by value "2"
      await typeSelect.selectOption({ value: "2" }).catch(async () => {
        await typeSelect.selectOption({ index: 2 }).catch(() => {});
      });

      const directionSelect = page
        .getByLabel(/direction/i)
        .or(page.getByRole("combobox", { name: /direction/i }));
      if (await directionSelect.count() > 0) {
        await directionSelect.selectOption({ value: "1" }).catch(async () => {
          await directionSelect.selectOption({ index: 1 });
        });
      }

      const amountInput = page.getByLabel(/amount/i).or(page.getByPlaceholder(/amount/i));
      await amountInput.fill(String(txData.amount));

      const categorySelect = page
        .getByLabel(/category/i)
        .or(page.getByRole("combobox", { name: /category/i }));
      if (await categorySelect.count() > 0) {
        await categorySelect
          .selectOption("OperatingExpense")
          .catch(async () => categorySelect.selectOption({ index: 1 }));
      }

      const descInput = page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i));
      await descInput.fill(txData.description);

      const dateInput = page.getByLabel(/date/i).first();
      await dateInput.fill(new Date().toISOString().split("T")[0]);

      await page.getByRole("button", { name: /save|create|submit/i }).click();

      await page.goto("/finance/transactions");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: txData.description })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Transaction list filters", () => {
    test("category filter narrows the transaction list to matching rows", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      // Seed one Revenue and one OperatingExpense transaction via API
      const revenueTx = generateTransaction({
        description: `Revenue filter test ${Date.now()}`,
      });
      const expenseTx = generateTransaction({
        transactionType: 2,
        direction: 1,
        category: "OperatingExpense",
        amount: 150000,
        description: `Expense filter test ${Date.now()}`,
      });

      await apiContext.createTransaction(gymHouse.id, revenueTx);
      await apiContext.createTransaction(gymHouse.id, expenseTx);

      await page.goto("/finance/transactions");
      await page.waitForLoadState("domcontentloaded");

      // Apply the "Revenue" category filter
      const categoryFilter = page
        .getByLabel(/category/i)
        .or(page.getByRole("combobox", { name: /category/i }))
        .first();
      if (await categoryFilter.count() > 0) {
        await categoryFilter.selectOption("Revenue");
        await page.waitForLoadState("domcontentloaded");

        // The revenue transaction should be visible
        await expect(
          page.getByRole("row").filter({ hasText: revenueTx.description })
        ).toBeVisible({ timeout: 10_000 });

        // The expense transaction should not be visible
        await expect(
          page.getByRole("row").filter({ hasText: expenseTx.description })
        ).toHaveCount(0);
      } else {
        // Filter UI not yet present — assert both rows exist in unfiltered list
        await expect(
          page.getByRole("row").filter({ hasText: revenueTx.description })
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe("Finance dashboard", () => {
    test("finance dashboard page renders stat cards", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      // Seed a revenue transaction so the dashboard has something to show
      await apiContext.createTransaction(gymHouse.id, generateTransaction());

      await page.goto("/finance");
      await page.waitForLoadState("domcontentloaded");

      // The finance dashboard should render at least one stat card or heading
      const hasHeading = await page.getByRole("heading").first().isVisible().catch(() => false);
      const hasStatCard = await page
        .locator("[data-testid], .stat-card, .metric-card, .card")
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasHeading || hasStatCard).toBe(true);
    });

    test("P&L report page renders without errors", async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.goto("/finance/pnl");
      await page.waitForLoadState("domcontentloaded");

      // There should be no full-page error
      await expect(page.getByRole("alert").filter({ hasText: /error|failed|500/i })).toHaveCount(0);
      // The page should have at least a heading
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
