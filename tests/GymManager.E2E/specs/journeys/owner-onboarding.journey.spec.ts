/**
 * Owner Onboarding Journey
 *
 * Tests a complete owner onboarding flow from registration to first revenue.
 * Each step builds on the previous one using shared state declared in the
 * describe scope. This is an API-only journey — no browser is involved.
 */

import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  getGymHouses,
  createMember,
  getMembers,
  createSubscription,
  getSubscriptionsByMember,
  createTimeSlot,
  createBooking,
  getBookingById,
  checkInBooking,
  createTransaction,
  getTransactions,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  SubscriptionDto,
  TimeSlotDto,
  BookingDto,
  TransactionDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateTimeSlot,
  generateBooking,
  generateTransaction,
} from "../../helpers/test-data.js";

test.describe("Owner Onboarding Journey", () => {
  let auth: AuthResponse;
  let gymHouse: GymHouseDto;
  let member: MemberDto;
  let subscription: SubscriptionDto;
  let timeSlot: TimeSlotDto;
  let booking: BookingDto;
  let transaction: TransactionDto;

  test("Step 1: Register as new owner", async () => {
    const user = generateUser();
    auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    expect(auth.accessToken).toBeTruthy();
    expect(auth.userId).toBeTruthy();
  });

  test("Step 2: Verify empty state — no gym houses", async () => {
    const houses = await getGymHouses(auth.accessToken);
    expect(houses).toHaveLength(0);
  });

  test("Step 3: Create first gym house", async () => {
    gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
    expect(gymHouse.id).toBeTruthy();
    expect(gymHouse.ownerId).toBe(auth.userId);
  });

  test("Step 4: Verify gym house in list", async () => {
    const houses = await getGymHouses(auth.accessToken);
    expect(houses).toHaveLength(1);
    expect(houses[0].id).toBe(gymHouse.id);
  });

  test("Step 5: Add first member", async () => {
    member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
    expect(member.id).toBeTruthy();
    expect(member.gymHouseId).toBe(gymHouse.id);
  });

  test("Step 6: Create subscription for member", async () => {
    subscription = await createSubscription(
      gymHouse.id,
      member.id,
      generateSubscription(),
      auth.accessToken,
    );
    expect(subscription.status).toBe("Active");
  });

  test("Step 7: Verify member has subscription", async () => {
    const subs = await getSubscriptionsByMember(gymHouse.id, member.id, auth.accessToken);
    expect(subs.length).toBeGreaterThanOrEqual(1);
    expect(subs[0].id).toBe(subscription.id);
  });

  test("Step 8: Create time slot and book member", async () => {
    timeSlot = await createTimeSlot(gymHouse.id, generateTimeSlot(), auth.accessToken);
    booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: timeSlot.id }),
      auth.accessToken,
    );
    expect(booking.status).toBe(0); // Confirmed
  });

  test("Step 9: Check in the booking", async () => {
    const checked = await checkInBooking(
      gymHouse.id,
      booking.id,
      { source: 1 }, // ManualByStaff
      auth.accessToken,
    );
    expect(checked.status).toBe(3); // Completed
    expect(checked.checkedInAt).toBeTruthy();
  });

  test("Step 10: Record revenue transaction", async () => {
    transaction = await createTransaction(
      gymHouse.id,
      generateTransaction(),
      auth.accessToken,
    );
    expect(transaction.id).toBeTruthy();
    const txList = await getTransactions(gymHouse.id, auth.accessToken);
    expect(txList.items.length).toBeGreaterThanOrEqual(1);
  });
});
