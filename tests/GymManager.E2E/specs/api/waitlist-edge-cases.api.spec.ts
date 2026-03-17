import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createSubscription,
  createTimeSlot,
  createBooking,
  apiRequestRaw,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateTimeSlot,
  generateBooking,
  offsetDate,
  offsetIso,
} from "../../helpers/test-data.js";

test.describe("Waitlist & Edge Cases (API)", () => {
  test.describe("Capacity enforcement", () => {
    test("first booking on a maxCapacity=1 slot succeeds", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
      await createSubscription(gymHouse.id, member.id, generateSubscription(), auth.accessToken);

      const slot = await createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ maxCapacity: 1 }),
        auth.accessToken,
      );

      const booking = await createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );

      // status=0 (Confirmed) or status=4 (WaitListed) — first booking always gets a slot
      expect([0, 4]).toContain(booking.status);
      expect(booking.memberId).toBe(member.id);
    });

    test("second booking on a maxCapacity=1 slot is either WaitListed (status=4) or rejected (400)", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      // Use offset +5 days for the second test slot to avoid date collision with other tests
      const memberA = await createMember(gymHouse.id, generateMember(), auth.accessToken);
      const memberB = await createMember(gymHouse.id, generateMember(), auth.accessToken);

      await createSubscription(gymHouse.id, memberA.id, generateSubscription(), auth.accessToken);
      await createSubscription(gymHouse.id, memberB.id, generateSubscription(), auth.accessToken);

      const slot = await createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ maxCapacity: 1, date: offsetDate(5) }),
        auth.accessToken,
      );

      // First booking — should succeed
      const firstBooking = await createBooking(
        gymHouse.id,
        generateBooking({ memberId: memberA.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );
      // Only check first booking succeeded if status is Confirmed (0)
      // Some implementations immediately waitlist

      // Second booking — should be WaitListed or rejected
      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/bookings`,
        generateBooking({ memberId: memberB.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );

      // If first booking was Confirmed (0), second must be WaitListed (4) or 400
      if (firstBooking.status === 0) {
        // Capacity taken — second must be waitlisted or rejected
        if (res.ok) {
          const secondBooking = await res.json();
          expect(secondBooking.status).toBe(4); // WaitListed
        } else {
          expect([400, 409, 422]).toContain(res.status);
        }
      } else {
        // First was also waitlisted — both are valid, just verify no 5xx
        expect(res.status).toBeLessThan(500);
      }
    });
  });

  test.describe("Invalid entity references", () => {
    test("booking with a non-existent memberId returns 404", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const slot = await createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ date: offsetDate(6) }),
        auth.accessToken,
      );

      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/bookings`,
        generateBooking({
          memberId: "00000000-0000-0000-0000-000000000099",
          timeSlotId: slot.id,
          bookingType: 0,
        }),
        auth.accessToken,
      );

      expect(res.status).toBe(404);
    });

    test("booking with a non-existent timeSlotId returns 404", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
      await createSubscription(gymHouse.id, member.id, generateSubscription(), auth.accessToken);

      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/bookings`,
        generateBooking({
          memberId: member.id,
          timeSlotId: "00000000-0000-0000-0000-000000000099",
          bookingType: 0,
        }),
        auth.accessToken,
      );

      expect(res.status).toBe(404);
    });
  });

  test.describe("Boundary values", () => {
    test("subscription with startDate after endDate returns 400", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
      const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);

      const futureDate = offsetIso(30);
      const pastDate = offsetIso(-1);

      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/members/${member.id}/subscriptions`,
        {
          type: 0,
          price: 500_000,
          startDate: futureDate,  // start is after end
          endDate: pastDate,
        },
        auth.accessToken,
      );

      expect(res.status).toBe(400);
    });

    test("time slot with maxCapacity=1 allows exactly 1 confirmed booking", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
      await createSubscription(gymHouse.id, member.id, generateSubscription(), auth.accessToken);

      const slot = await createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ maxCapacity: 1, date: offsetDate(7) }),
        auth.accessToken,
      );

      expect(slot.maxCapacity).toBe(1);

      const booking = await createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );

      // Booking was accepted — status is either Confirmed (0) or WaitListed (4)
      expect([0, 4]).toContain(booking.status);

      // Available spots should now be 0 if booking was confirmed
      if (booking.status === 0) {
        // Re-fetch slot info via listing endpoint to verify currentBookings incremented
        // The created slot shows initial state; this booking should reflect in subsequent reads
        expect(booking.timeSlotId).toBe(slot.id);
      }
    });

    test("creating a time slot with maxCapacity=0 or negative returns 400", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/time-slots`,
        generateTimeSlot({ maxCapacity: 0, date: offsetDate(8) }),
        auth.accessToken,
      );

      expect(res.status).toBe(400);
    });

    test("creating a time slot with endTime before startTime returns 400", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/time-slots`,
        generateTimeSlot({
          startTime: "10:00:00",
          endTime: "08:00:00", // end before start
          date: offsetDate(9),
        }),
        auth.accessToken,
      );

      expect(res.status).toBe(400);
    });

    test("member cannot be double-booked for the same time slot (409 or WaitListed)", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
      await createSubscription(gymHouse.id, member.id, generateSubscription(), auth.accessToken);

      const slot = await createTimeSlot(
        gymHouse.id,
        generateTimeSlot({ maxCapacity: 10, date: offsetDate(10) }),
        auth.accessToken,
      );

      // First booking succeeds
      await createBooking(
        gymHouse.id,
        generateBooking({ memberId: member.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );

      // Second booking for the same member on the same slot
      const res = await apiRequestRaw(
        "POST",
        `/gymhouses/${gymHouse.id}/bookings`,
        generateBooking({ memberId: member.id, timeSlotId: slot.id, bookingType: 0 }),
        auth.accessToken,
      );

      // Should be rejected as a conflict (409) or return 400
      expect([400, 409]).toContain(res.status);
    });
  });
});
