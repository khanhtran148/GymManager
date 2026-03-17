/**
 * Member Lifecycle Journey
 *
 * Tests a complete member lifecycle: creation, subscription, booking, check-in,
 * then subscription state transitions — freeze, renew, cancel.
 * Each step builds on the previous one using shared state declared in the
 * describe scope. This is an API-only journey — no browser is involved.
 */

import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createSubscription,
  createTimeSlot,
  createBooking,
  checkInBooking,
  freezeSubscription,
  renewSubscription,
  cancelSubscription,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  SubscriptionDto,
  TimeSlotDto,
  BookingDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateTimeSlot,
  generateBooking,
  generateRenewSubscription,
} from "../../helpers/test-data.js";

test.describe("Member Lifecycle Journey", () => {
  let auth: AuthResponse;
  let gymHouse: GymHouseDto;
  let member: MemberDto;
  let subscription: SubscriptionDto;
  let timeSlot: TimeSlotDto;
  let booking: BookingDto;

  test("Step 1: Owner registers and creates gym house", async () => {
    const user = generateUser();
    auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    expect(auth.accessToken).toBeTruthy();
    expect(auth.userId).toBeTruthy();

    gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
    expect(gymHouse.id).toBeTruthy();
    expect(gymHouse.ownerId).toBe(auth.userId);
  });

  test("Step 2: Create a member", async () => {
    member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
    expect(member.id).toBeTruthy();
    expect(member.gymHouseId).toBe(gymHouse.id);
    expect(member.status).toBe("Active");
  });

  test("Step 3: Create Active subscription", async () => {
    subscription = await createSubscription(
      gymHouse.id,
      member.id,
      generateSubscription(),
      auth.accessToken,
    );
    expect(subscription.id).toBeTruthy();
    expect(subscription.memberId).toBe(member.id);
    expect(subscription.gymHouseId).toBe(gymHouse.id);
    expect(subscription.status).toBe("Active");
  });

  test("Step 4: Book a time slot", async () => {
    timeSlot = await createTimeSlot(gymHouse.id, generateTimeSlot(), auth.accessToken);
    expect(timeSlot.id).toBeTruthy();

    booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: timeSlot.id }),
      auth.accessToken,
    );
    expect(booking.id).toBeTruthy();
    expect(booking.memberId).toBe(member.id);
    expect(booking.timeSlotId).toBe(timeSlot.id);
    expect(booking.status).toBe(0); // Confirmed
  });

  test("Step 5: Check in", async () => {
    const checked = await checkInBooking(
      gymHouse.id,
      booking.id,
      { source: 1 }, // ManualByStaff
      auth.accessToken,
    );
    expect(checked.status).toBe(3); // Completed
    expect(checked.checkedInAt).toBeTruthy();
  });

  test("Step 6: Freeze subscription — verify status is Frozen", async () => {
    const frozen = await freezeSubscription(
      subscription.id,
      {
        gymHouseId: gymHouse.id,
        frozenUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      auth.accessToken,
    );
    expect(frozen.id).toBe(subscription.id);
    expect(frozen.status).toBe("Frozen");
    expect(frozen.frozenAt).toBeTruthy();
    expect(frozen.frozenUntil).toBeTruthy();

    // Keep the updated subscription for subsequent steps
    subscription = frozen;
  });

  test("Step 7: Renew subscription — verify status is Active with new dates", async () => {
    const renewed = await renewSubscription(
      subscription.id,
      generateRenewSubscription({ gymHouseId: gymHouse.id }),
      auth.accessToken,
    );
    expect(renewed.id).toBe(subscription.id);
    expect(renewed.status).toBe("Active");
    // End date must be later than the original subscription end date
    expect(new Date(renewed.endDate).getTime()).toBeGreaterThan(
      new Date(subscription.endDate).getTime(),
    );

    subscription = renewed;
  });

  test("Step 8: Cancel subscription — verify status is Cancelled", async () => {
    const cancelled = await cancelSubscription(
      subscription.id,
      { gymHouseId: gymHouse.id },
      auth.accessToken,
    );
    expect(cancelled.id).toBe(subscription.id);
    expect(cancelled.status).toBe("Cancelled");
  });
});
