import { test, expect } from "../../fixtures/auth.fixture.js";
import { GymHouseDto } from "../../helpers/api-client.js";
import { generateGymHouse, generateAnnouncement } from "../../helpers/test-data.js";

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

      // Title (label htmlFor="title")
      const titleInput = page.getByLabel(/^title$/i);
      await titleInput.fill(announcementData.title);

      // Content (label htmlFor="content", textarea element)
      const contentInput = page.getByLabel(/^content$/i);
      await contentInput.fill(announcementData.content);

      // Gym House selector (only visible when "Chain-wide" checkbox is unchecked)
      // The select has id="gymHouseId" with label "Gym House"
      const gymHouseSelect = page.locator("select#gymHouseId");
      if (await gymHouseSelect.isVisible().catch(() => false)) {
        await gymHouseSelect.selectOption({ value: gymHouse.id }).catch(async () => {
          await gymHouseSelect.selectOption({ index: 1 });
        });
      }

      // Target Audience (label htmlFor="targetAudience")
      const audienceSelect = page.getByLabel(/target audience/i);
      await audienceSelect.selectOption("AllMembers");

      // Publish At (label htmlFor="publishAt", datetime-local input)
      const publishAtInput = page.getByLabel(/publish at/i);
      const publishIso = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);
      await publishAtInput.fill(publishIso);

      // Submit button text is "Create Announcement"
      await page.getByRole("button", { name: /create announcement/i }).click();

      // Navigate to the announcements list
      await page.goto("/announcements");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: announcementData.title })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("View announcement", () => {
    // Note: there is no /announcements/[id] detail page in the current frontend.
    // The announcement detail view test is skipped until the page is implemented.
    test.skip("navigates to announcement detail and displays the title and content", async ({
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
