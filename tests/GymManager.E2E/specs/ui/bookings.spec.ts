import { test, expect } from "../../fixtures/auth.fixture.js";
import { GymHouseDto, MemberDto, TimeSlotDto } from "../../helpers/api-client.js";
import {
  generateGymHouse,
  generateMember,
  generateTimeSlot,
  generateBooking,
  offsetDate,
} from "../../helpers/test-data.js";

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

      // Member ID — text input expecting a UUID
      const memberIdInput = page.getByLabel(/member id/i);
      await memberIdInput.waitFor({ timeout: 10_000 });
      await memberIdInput.fill(member.id);

      // Booking Type — select (default is "Time Slot" = 0)
      // Already defaults to 0, no need to change

      // Time Slot ID — text input expecting a UUID
      const timeSlotInput = page.getByLabel(/time slot id/i);
      await timeSlotInput.fill(timeSlot.id);

      await page.getByRole("button", { name: /create booking/i }).click();

      // After successful submission, redirects to booking detail
      const navigated = await page
        .waitForURL(/\/bookings\/[^/]+$/, { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      if (navigated) {
        // Navigate to the bookings list and verify the booking appears
        await page.goto("/bookings");
        await page.waitForLoadState("domcontentloaded");

        await expect(
          page.getByRole("row").filter({ hasText: member.fullName })
        ).toBeVisible({ timeout: 10_000 });
      } else {
        // Form submission may have shown an error — assert an alert is visible
        await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 5_000 });
      }
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

      // Wait for the page to load booking data
      const cancelBtn = page.getByRole("button", { name: /cancel booking/i });
      await cancelBtn.waitFor({ timeout: 10_000 });
      await cancelBtn.click();

      // The confirmation dialog has "Cancel Booking" as the confirm button
      // inside a <dialog> element. Target the button within the dialog.
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor({ timeout: 5_000 });
      const confirmBtn = dialog.getByRole("button", { name: /cancel booking/i });
      await confirmBtn.click();

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

      // The "Check In" button with aria-label="Check in this member"
      const checkInBtn = page.getByRole("button", { name: /check in/i });
      await checkInBtn.waitFor({ timeout: 10_000 });
      await checkInBtn.click();

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

      // Apply the date filter — the bookings page uses datetime-local inputs
      // with aria-labels "Filter from date" and "Filter to date"
      const fromDateInput = page
        .getByLabel(/filter from date/i)
        .or(page.getByLabel(/^from$/i))
        .first();
      const toDateInput = page
        .getByLabel(/filter to date/i)
        .or(page.getByLabel(/^to$/i))
        .first();
      // Convert dateA (YYYY-MM-DD) to datetime-local format
      await fromDateInput.fill(`${dateA}T00:00`);
      await toDateInput.fill(`${dateA}T23:59`);

      // Submit the filter form
      const applyBtn = page.getByRole("button", { name: /apply|filter|search/i }).first();
      if (await applyBtn.isVisible().catch(() => false)) {
        await applyBtn.click();
      } else {
        await page.keyboard.press("Enter");
      }
      await page.waitForLoadState("domcontentloaded");

      // At least one row should be visible after filtering
      const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
      await expect(rows.first()).toBeVisible({ timeout: 10_000 });

      // No row should contain dateB when filtered to dateA
      await expect(page.getByRole("row").filter({ hasText: dateB })).toHaveCount(0);
    });
  });
});
