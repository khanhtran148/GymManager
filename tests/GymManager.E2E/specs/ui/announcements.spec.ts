import { test, expect } from "../fixtures/auth.fixture.js";
import { GymHouseDto } from "../helpers/api-client.js";
import { generateGymHouse, generateAnnouncement } from "../helpers/test-data.js";

test.describe("Announcements", () => {
  let gymHouse: GymHouseDto;

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
  });

  test.describe("Create announcement", () => {
    test("creates an announcement via form and it appears in the announcements list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const announcementData = generateAnnouncement({ gymHouseId: gymHouse.id });

      await page.goto("/announcements/new");
      await page.waitForLoadState("domcontentloaded");

      // Title
      const titleInput = page
        .getByLabel(/title/i)
        .or(page.getByPlaceholder(/title/i));
      await titleInput.fill(announcementData.title);

      // Content / body
      const contentInput = page
        .getByLabel(/content|body/i)
        .or(page.getByPlaceholder(/content/i))
        .or(page.getByRole("textbox", { name: /content|message/i }));
      await contentInput.fill(announcementData.content);

      // Gym house selector (null = chain-wide, or select specific)
      const gymHouseSelect = page
        .getByLabel(/gym house/i)
        .or(page.getByRole("combobox", { name: /gym house/i }));
      if (await gymHouseSelect.count() > 0) {
        await gymHouseSelect
          .selectOption({ value: gymHouse.id })
          .catch(() => gymHouseSelect.selectOption({ index: 1 }));
      }

      // Target audience
      const audienceSelect = page
        .getByLabel(/audience|target/i)
        .or(page.getByRole("combobox", { name: /audience/i }));
      if (await audienceSelect.count() > 0) {
        await audienceSelect
          .selectOption("AllMembers")
          .catch(() => audienceSelect.selectOption({ index: 0 }));
      }

      // Publish date/time
      const publishAtInput = page
        .getByLabel(/publish|schedule/i)
        .or(page.getByRole("textbox", { name: /publish/i }));
      if (await publishAtInput.count() > 0) {
        const publishIso = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);
        await publishAtInput.fill(publishIso).catch(() => {});
      }

      await page.getByRole("button", { name: /save|create|submit/i }).click();

      // Navigate to the announcements list
      await page.goto("/announcements");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: announcementData.title })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("View announcement detail", () => {
    test("navigates to announcement detail and displays the title and content", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const data = generateAnnouncement({ gymHouseId: gymHouse.id });
      const announcement = await apiContext.createAnnouncement(data);

      await page.goto(`/announcements/${announcement.id}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(announcement.title, { exact: false })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(announcement.content, { exact: false })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("announcement created via API appears in the announcements list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const data = generateAnnouncement({ gymHouseId: gymHouse.id });
      const announcement = await apiContext.createAnnouncement(data);

      await page.goto("/announcements");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: announcement.title })
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
