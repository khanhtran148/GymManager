import { test, expect } from "../fixtures/auth.fixture.js";
import { GymHouseDto, MemberDto, TimeSlotDto } from "../helpers/api-client.js";
import {
  generateGymHouse,
  generateMember,
  generateTimeSlot,
  generateBooking,
  offsetDate,
} from "../helpers/test-data.js";

test.describe("Booking management", () => {
  let gymHouse: GymHouseDto;
  let member: MemberDto;
  let timeSlot: TimeSlotDto;

  test.beforeAll(async ({ apiContext }) => {
    gymHouse = await apiContext.createGymHouse(generateGymHouse());
    member = await apiContext.createMember(gymHouse.id, generateMember());
    timeSlot = await apiContext.createTimeSlot(gymHouse.id, generateTimeSlot());
  });

  test.describe("Create booking", () => {
    test("creates a booking via form and it appears in the bookings list", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      await page.goto("/bookings/new");
      await page.waitForLoadState("domcontentloaded");

      // Member selector — try value first, fall back to visible label
      const memberSelect = page
        .getByLabel(/member/i)
        .or(page.getByRole("combobox", { name: /member/i }));
      await memberSelect
        .selectOption({ value: member.id })
        .catch(() => memberSelect.selectOption({ label: member.fullName }));

      // Time slot selector
      const slotSelect = page
        .getByLabel(/time slot/i)
        .or(page.getByRole("combobox", { name: /time slot/i }));
      await slotSelect
        .selectOption({ value: timeSlot.id })
        .catch(() => slotSelect.selectOption({ index: 1 }));

      await page.getByRole("button", { name: /save|create|submit/i }).click();

      // Navigate to the bookings list and verify the booking appears
      await page.goto("/bookings");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByRole("row").filter({ hasText: member.fullName })
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Cancel booking", () => {
    test("cancels a booking and its status changes to Cancelled", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      const freshSlot = await apiContext.createTimeSlot(gymHouse.id, generateTimeSlot());
      const booking = await apiContext.createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: freshSlot.id })
      );

      await page.goto(`/bookings/${booking.id}`);
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("button", { name: /cancel/i }).click();

      // Handle confirmation dialog if rendered
      const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(/cancelled|canceled/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Check-in booking", () => {
    test("checks in a booking and the status reflects the check-in", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      // Use today's date for the time slot so check-in is allowed by the server
      const todaySlot = await apiContext.createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ date: offsetDate(0) })
      );
      const booking = await apiContext.createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: todaySlot.id })
      );

      await page.goto(`/bookings/${booking.id}`);
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("button", { name: /check.?in/i }).click();

      const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForLoadState("domcontentloaded");

      // Status should be Completed (=3) or display "Checked In"
      await expect(
        page.getByText(/checked.?in|completed/i)
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Bookings list date filter", () => {
    test("date filter shows only bookings matching the selected date", async ({
      authenticatedPage,
      apiContext,
    }) => {
      const page = authenticatedPage;

      const dateA = offsetDate(5);
      const dateB = offsetDate(6);

      const slotA = await apiContext.createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ date: dateA })
      );
      const slotB = await apiContext.createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ date: dateB })
      );
      await apiContext.createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: slotA.id })
      );
      await apiContext.createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: slotB.id })
      );

      await page.goto("/bookings");
      await page.waitForLoadState("domcontentloaded");

      // Apply the date filter to dateA
      const dateFilterInput = page
        .getByLabel(/date/i)
        .or(page.getByRole("textbox", { name: /date/i }))
        .first();
      await dateFilterInput.fill(dateA);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("domcontentloaded");

      // At least one row should be visible after filtering
      const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
      await expect(rows.first()).toBeVisible({ timeout: 10_000 });

      // No row should contain dateB when filtered to dateA
      await expect(page.getByRole("row").filter({ hasText: dateB })).toHaveCount(0);
    });
  });
});
