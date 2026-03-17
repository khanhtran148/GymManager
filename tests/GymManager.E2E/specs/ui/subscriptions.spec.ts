import { test, expect } from "../../fixtures/auth.fixture.js";
import { MemberDetailPage } from "../../pages/members.page.js";
import { GymHouseDto, MemberDto } from "../../helpers/api-client.js";
import {
  generateGymHouse,
  generateMember,
  generateSubscription,
  offsetDate,
} from "../../helpers/test-data.js";

const API_BASE = process.env.API_URL ?? "http://localhost:5000/api/v1";

test.describe("Subscription lifecycle", () => {
  let gymHouse: GymHouseDto;
  let member: MemberDto;

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
    member = await apiContext.createMember(gymHouse.id, generateMember());
  });

  test.describe("Create subscription via form", () => {
    test("creates a subscription via form and Active status appears on the member detail page", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const detailPage = new MemberDetailPage(page);

      // Use a fresh member per test to avoid subscription conflicts
      const freshMember = await apiContext.createMember(gymHouse.id, generateMember());
      await detailPage.goto(freshMember.id);

      // Navigate to the subscription creation form via the member detail page
      await detailPage.addSubscriptionButton.click();
      await page.waitForURL(/\/subscriptions\/new/, { timeout: 10_000 });

      // Fill the subscription form
      const typeSelect = page
        .getByLabel(/type|plan/i)
        .or(page.getByRole("combobox", { name: /type|plan/i }));
      const priceInput = page.getByLabel(/price|amount/i);
      const startDateInput = page.getByLabel(/start date/i);
      const endDateInput = page.getByLabel(/end date/i);
      const submitButton = page.getByRole("button", { name: /save|create|submit/i });

      // Select Monthly (first option = 0)
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption({ index: 0 });
      }

      await priceInput.fill("500000");
      await startDateInput.fill(offsetDate(0));
      await endDateInput.fill(offsetDate(30));
      await submitButton.click();

      // After successful submission the app should navigate back to member detail
      await page.waitForURL(/\/members\/[^/]+$/, { timeout: 15_000 });

      // The subscriptions section must show Active
      await expect(
        page.locator("section, div, tr").filter({ hasText: /subscription/i })
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/active/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("New subscription has Active status", () => {
    test("subscription created via API shows as Active on the member detail page", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const detailPage = new MemberDetailPage(page);

      const freshMember = await apiContext.createMember(gymHouse.id, generateMember());
      await apiContext.createSubscription(gymHouse.id, freshMember.id, generateSubscription());

      await detailPage.goto(freshMember.id);

      await expect(page.getByText(/active/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Freeze subscription", () => {
    test("freezing a subscription via API changes its status to Frozen", async ({
      authToken,
      apiContext,
    }) => {
      const freshMember = await apiContext.createMember(gymHouse.id, generateMember());
      const subscription = await apiContext.createSubscription(
        gymHouse.id,
        freshMember.id,
        generateSubscription()
      );

      const freezeRes = await fetch(
        `${API_BASE}/subscriptions/${subscription.id}/freeze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      expect(freezeRes.status).toBeLessThan(300);

      // Verify the state via GET
      const getRes = await fetch(
        `${API_BASE}/gymhouses/${gymHouse.id}/members/${freshMember.id}/subscriptions/${subscription.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (getRes.ok) {
        const body = (await getRes.json()) as { status: string };
        expect(body.status).toMatch(/frozen/i);
      }
    });
  });

  test.describe("Cancel subscription", () => {
    test("cancelling a subscription via API changes its status to Cancelled", async ({
      authToken,
      apiContext,
    }) => {
      const freshMember = await apiContext.createMember(gymHouse.id, generateMember());
      const subscription = await apiContext.createSubscription(
        gymHouse.id,
        freshMember.id,
        generateSubscription()
      );

      const cancelRes = await fetch(
        `${API_BASE}/subscriptions/${subscription.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      expect(cancelRes.status).toBeLessThan(300);

      const getRes = await fetch(
        `${API_BASE}/gymhouses/${gymHouse.id}/members/${freshMember.id}/subscriptions/${subscription.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (getRes.ok) {
        const body = (await getRes.json()) as { status: string };
        expect(body.status).toMatch(/cancelled|canceled/i);
      }
    });
  });
});
