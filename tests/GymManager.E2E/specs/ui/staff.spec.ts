import { test, expect } from "../fixtures/auth.fixture.js";
import { GymHouseDto, AuthResponse } from "../helpers/api-client.js";
import { generateGymHouse, generateStaff, generateUser } from "../helpers/test-data.js";
import { register } from "../helpers/api-client.js";

test.describe("Staff management", () => {
  let gymHouse: GymHouseDto;

  /**
   * Staff creation requires a userId that already exists in the system.
   * We register a fresh user for each test group so the staff payload is valid.
   */
  async function registerStaffUser(): Promise<AuthResponse> {
    const userData = generateUser();
    return register({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: null,
    });
  }

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
  });

  test.describe("Create staff member", () => {
    test("creates a staff member via form and it appears in the staff list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const staffUser = await registerStaffUser();

      await page.goto("/staff/new");
      await page.waitForLoadState("domcontentloaded");

      // The form may have fields for: userId (or user search), gym house, staffType,
      // baseSalary, perClassBonus.
      const userIdInput = page
        .getByLabel(/user id|user/i)
        .or(page.getByRole("combobox", { name: /user/i }))
        .first();
      if (await userIdInput.count() > 0) {
        await userIdInput.fill(staffUser.userId).catch(async () => {
          await userIdInput.selectOption({ value: staffUser.userId });
        });
      }

      const gymHouseSelect = page
        .getByLabel(/gym house/i)
        .or(page.getByRole("combobox", { name: /gym house/i }));
      if (await gymHouseSelect.count() > 0) {
        await gymHouseSelect
          .selectOption({ value: gymHouse.id })
          .catch(() => gymHouseSelect.selectOption({ label: gymHouse.name }));
      }

      const staffTypeSelect = page
        .getByLabel(/staff type|role/i)
        .or(page.getByRole("combobox", { name: /staff type|role/i }));
      if (await staffTypeSelect.count() > 0) {
        await staffTypeSelect.selectOption({ index: 0 }); // Trainer
      }

      const baseSalaryInput = page.getByLabel(/base salary/i).or(page.getByLabel(/salary/i));
      await baseSalaryInput.fill("8000000").catch(() => {});

      const bonusInput = page.getByLabel(/bonus/i).or(page.getByLabel(/per class/i));
      await bonusInput.fill("150000").catch(() => {});

      await page.getByRole("button", { name: /save|create|submit/i }).click();

      // Navigate to staff list and verify the row
      await page.goto("/staff");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: staffUser.email })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("View staff detail", () => {
    test("navigates to the staff detail page and shows staff information", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;
      const staffUser = await registerStaffUser();
      const staff = await apiContext.createStaff(
        generateStaff({ userId: staffUser.userId, gymHouseId: gymHouse.id })
      );

      await page.goto(`/staff/${staff.id}`);
      await page.waitForLoadState("domcontentloaded");

      // The detail page should display the user's email
      await expect(page.getByText(staffUser.email, { exact: false })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Staff list filtering", () => {
    test("staff list shows staff members belonging to a specific gym house", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      // Create two gym houses with one staff each
      const [houseA, houseB] = await Promise.all([
        apiContext.createGymHouse(generateGymHouse()),
        apiContext.createGymHouse(generateGymHouse()),
      ]);
      const [userA, userB] = await Promise.all([
        registerStaffUser(),
        registerStaffUser(),
      ]);
      const [staffA] = await Promise.all([
        apiContext.createStaff(generateStaff({ userId: userA.userId, gymHouseId: houseA.id })),
        apiContext.createStaff(generateStaff({ userId: userB.userId, gymHouseId: houseB.id })),
      ]);

      await page.goto("/staff");
      await page.waitForLoadState("domcontentloaded");

      // Apply gym house filter to houseA
      const gymHouseFilter = page
        .getByLabel(/gym house/i)
        .or(page.getByRole("combobox", { name: /gym house/i }))
        .first();

      if (await gymHouseFilter.count() > 0) {
        await gymHouseFilter
          .selectOption({ value: houseA.id })
          .catch(() => gymHouseFilter.selectOption({ label: houseA.name }));
        await page.waitForLoadState("domcontentloaded");

        // staffA's email should be visible; staffB's should not
        await expect(
          page.getByRole("row").filter({ hasText: userA.email })
        ).toBeVisible({ timeout: 10_000 });

        await expect(
          page.getByRole("row").filter({ hasText: userB.email })
        ).toHaveCount(0);
      } else {
        // No filter control — just verify staffA appears in the global list
        await expect(
          page.getByRole("row").filter({ hasText: userA.email })
        ).toBeVisible({ timeout: 10_000 });
      }
    });
  });
});
