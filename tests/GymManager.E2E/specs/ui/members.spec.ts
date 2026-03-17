import { test, expect } from "../fixtures/auth.fixture.js";
import { MembersPage, MemberFormPage } from "../pages/members.page.js";
import { MemberDetailPage } from "../pages/members.page.js";
import { GymHouseDto } from "../helpers/api-client.js";
import { generateGymHouse, generateMember } from "../helpers/test-data.js";

test.describe("Member management", () => {
  let gymHouse: GymHouseDto;

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
  });

  test.describe("Create member", () => {
    test("creates a member via form and it appears in the list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new MembersPage(page);
      const formPage = new MemberFormPage(page);
      const data = generateMember();

      await listPage.goto();
      await listPage.gotoNew();
      await page.waitForURL(/\/members\/new/, { timeout: 10_000 });

      // The form takes email, fullName, phone. The gym house is either pre-selected
      // from routing context or chosen via a hidden/separate selector — we fill
      // what the API contract requires.
      await formPage.fillAndSubmit({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? "",
      });

      // Successful submission redirects away from /new
      await page.waitForURL((url) => !url.pathname.includes("/new"), {
        timeout: 15_000,
      });

      if (page.url().match(/\/members\/[^/]+$/)) {
        // Landed on member detail — full name must be visible
        await expect(page.getByText(data.fullName, { exact: false })).toBeVisible();
      } else {
        // Landed back on list
        await listPage.goto();
        await expect(
          page.getByRole("row").filter({ hasText: data.fullName })
        ).toBeVisible({ timeout: 10_000 });
      }
    });

    test("shows error when a duplicate email is used within the same gym house", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const formPage = new MemberFormPage(page);
      const data = generateMember();

      // Pre-create the member via API so the email already exists
      await apiContext.createMember(gymHouse.id, data);

      await formPage.goto();
      await formPage.fillAndSubmit({
        fullName: "Another Member",
        email: data.email,
        phone: "",
      });

      await expect(formPage.errorAlert).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("alert").filter({ hasText: /email|already|exist|taken|conflict/i })
      ).toBeVisible();
    });
  });

  test.describe("View member detail", () => {
    test("shows full name and email on the member detail page", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const data = generateMember();
      const member = await apiContext.createMember(gymHouse.id, data);

      await page.goto(`/members/${member.id}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(member.fullName, { exact: false })).toBeVisible();
      await expect(page.getByText(member.email, { exact: false })).toBeVisible();
    });
  });

  test.describe("Search members", () => {
    test("filtering by name shows only matching members", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new MembersPage(page);

      const uniqueName = `AlphaSearchable${Date.now()}`;
      const target = generateMember({ fullName: uniqueName });
      const other = generateMember({ fullName: `BetaDifferent${Date.now()}` });
      await apiContext.createMember(gymHouse.id, target);
      await apiContext.createMember(gymHouse.id, other);

      await listPage.goto();
      await listPage.search(uniqueName);

      await expect(
        page.getByRole("row").filter({ hasText: uniqueName })
      ).toBeVisible({ timeout: 10_000 });

      await expect(
        page.getByRole("row").filter({ hasText: other.fullName })
      ).toHaveCount(0);
    });
  });

  test.describe("Pagination", () => {
    test("pagination controls appear when the member count exceeds one page", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new MembersPage(page);

      // Default page size is 20 — create 22 to guarantee overflow
      await Promise.all(
        Array.from({ length: 22 }, () =>
          apiContext.createMember(gymHouse.id, generateMember())
        )
      );

      await listPage.goto();
      await page.waitForLoadState("domcontentloaded");

      const hasNextButton = await listPage.paginationNext.isVisible().catch(() => false);
      const hasPageTwoButton = await page
        .getByRole("button", { name: /^2$/ })
        .isVisible()
        .catch(() => false);
      const hasPageTwoLabel = await page
        .getByLabel(/page 2/i)
        .isVisible()
        .catch(() => false);

      expect(hasNextButton || hasPageTwoButton || hasPageTwoLabel).toBe(true);
    });
  });
});
