import { test, expect } from "../../fixtures/auth.fixture.js";
import { GymHousesPage, GymHouseFormPage } from "../../pages/gym-houses.page.js";
import { generateGymHouse } from "../../helpers/test-data.js";

test.describe("Gym House management", () => {
  test.describe("Create gym house", () => {
    test("creates a gym house via form and it appears in the list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new GymHousesPage(page);
      const formPage = new GymHouseFormPage(page);
      const data = generateGymHouse();

      await listPage.goto();
      await listPage.gotoNew();
      await page.waitForURL(/\/gym-houses\/new/, { timeout: 10_000 });

      await formPage.fillAndSubmit({
        name: data.name,
        address: data.address,
        phone: data.phone ?? "",
        operatingHours: data.operatingHours ?? "06:00-22:00",
        hourlyCapacity: data.hourlyCapacity,
      });

      // Successful submission navigates away from /new
      await page.waitForURL((url) => !url.pathname.includes("/new"), {
        timeout: 15_000,
      });

      await listPage.goto();
      await expect(
        page.getByRole("row").filter({ hasText: data.name })
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows validation errors when required fields are submitted empty", async ({
      authenticatedPage,
    }) => {
      const page = authenticatedPage;
      const formPage = new GymHouseFormPage(page);

      await formPage.goto();
      await formPage.submit();

      // At least one field should be marked invalid or an alert should appear
      const hasInvalidField = await formPage.invalidFields.first().isVisible().catch(() => false);
      const hasAlert = await formPage.errorAlert.isVisible().catch(() => false);
      expect(hasInvalidField || hasAlert).toBe(true);
    });
  });

  test.describe("View gym house details", () => {
    test("navigates to gym house detail page and displays the gym house name", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const gymHouse = await apiContext.createGymHouse(generateGymHouse());

      await page.goto(`/gym-houses/${gymHouse.id}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(gymHouse.name, { exact: false })).toBeVisible();
    });
  });

  test.describe("Update gym house", () => {
    test("updates the gym house name and the new name is displayed on the page", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const gymHouse = await apiContext.createGymHouse(generateGymHouse());

      await page.goto(`/gym-houses/${gymHouse.id}`);
      await page.waitForLoadState("domcontentloaded");

      const editButton = page
        .getByRole("button", { name: /edit/i })
        .or(page.getByRole("link", { name: /edit/i }));
      await editButton.click();

      const updatedName = `${gymHouse.name} UPDATED`;
      const nameInput = page.getByLabel(/^name$/i).or(page.getByLabel(/gym house name/i));
      await nameInput.clear();
      await nameInput.fill(updatedName);

      await page.getByRole("button", { name: /save|update|submit/i }).click();
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(updatedName, { exact: false })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Delete gym house", () => {
    test("deletes a gym house and it no longer appears in the list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new GymHousesPage(page);
      const gymHouse = await apiContext.createGymHouse(generateGymHouse());

      await listPage.goto();
      await expect(
        page.getByRole("row").filter({ hasText: gymHouse.name })
      ).toBeVisible({ timeout: 10_000 });

      // Click the delete button in the matching row
      const row = page.getByRole("row").filter({ hasText: gymHouse.name });
      await row.getByRole("button", { name: /delete|remove/i }).click();

      // Confirm deletion if a dialog appears
      const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }

      await expect(
        page.getByRole("row").filter({ hasText: gymHouse.name })
      ).toHaveCount(0, { timeout: 10_000 });
    });
  });

  test.describe("Gym house list", () => {
    test("all created gym houses appear in the list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const listPage = new GymHousesPage(page);

      const [houseA, houseB] = await Promise.all([
        apiContext.createGymHouse(generateGymHouse()),
        apiContext.createGymHouse(generateGymHouse()),
      ]);

      await listPage.goto();

      await expect(
        page.getByRole("row").filter({ hasText: houseA.name })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("row").filter({ hasText: houseB.name })
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
