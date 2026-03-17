import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createSubscription,
  createTimeSlot,
  getTimeSlots,
  createClassSchedule,
  getClassSchedules,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  checkInBooking,
  markNoShow,
  apiRequestRaw,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  TimeSlotDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateTimeSlot,
  generateClassSchedule,
  generateBooking,
  offsetDate,
  offsetIso,
} from "../../helpers/test-data.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BookingTestContext {
  auth: AuthResponse;
  gymHouse: GymHouseDto;
  member: MemberDto;
  slot: TimeSlotDto;
}

async function setupBookingContext(): Promise<BookingTestContext> {
  const user = generateUser();
  const auth = await register({
    email: user.email,
    password: user.password,
    fullName: user.fullName,
    phone: null,
  });
  const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
  const member = await createMember(
    gymHouse.id,
    generateMember(),
    auth.accessToken,
  );
  await createSubscription(
    gymHouse.id,
    member.id,
    generateSubscription(),
    auth.accessToken,
  );
  const slot = await createTimeSlot(
    gymHouse.id,
    generateTimeSlot(),
    auth.accessToken,
  );
  return { auth, gymHouse, member, slot };
}

// ---------------------------------------------------------------------------
// Time slot booking flow
// ---------------------------------------------------------------------------

test.describe("Time slot booking flow (API)", () => {
  test("creates a booking and returns Confirmed status", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    expect(booking.id).toBeTruthy();
    expect(booking.memberId).toBe(member.id);
    expect(booking.timeSlotId).toBe(slot.id);
    expect(booking.status).toBe(0); // Confirmed
    expect(booking.checkedInAt).toBeNull();
  });

  test("check-in transitions booking to Completed status", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    const checkedIn = await checkInBooking(
      gymHouse.id,
      booking.id,
      { source: 1 }, // ManualByStaff
      auth.accessToken,
    );

    expect(checkedIn.status).toBe(3); // Completed
    expect(checkedIn.checkedInAt).not.toBeNull();
    expect(checkedIn.checkInSource).toBe(1);
  });

  test("checked-in booking appears in gym house booking list", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );
    await checkInBooking(
      gymHouse.id,
      booking.id,
      { source: 0 }, // QRScan
      auth.accessToken,
    );

    const list = await getBookings(gymHouse.id, auth.accessToken);
    const found = list.items.find((b) => b.id === booking.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe(3); // Completed
  });
});

// ---------------------------------------------------------------------------
// Cancel booking flow
// ---------------------------------------------------------------------------

test.describe("Cancel booking flow (API)", () => {
  test("cancels a booking and status becomes Cancelled", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    await cancelBooking(gymHouse.id, booking.id, auth.accessToken);

    const fetched = await getBookingById(gymHouse.id, booking.id, auth.accessToken);
    expect(fetched.status).toBe(1); // Cancelled
  });

  test("cancelling a booking restores available spots on the time slot", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    // Fetch slots to confirm available spots decreased
    const slotsAfterBook = await getTimeSlots(gymHouse.id, auth.accessToken);
    const slotAfterBook = slotsAfterBook.find((s) => s.id === slot.id)!;
    expect(slotAfterBook.currentBookings).toBe(1);
    expect(slotAfterBook.availableSpots).toBe(slot.maxCapacity - 1);

    await cancelBooking(gymHouse.id, booking.id, auth.accessToken);

    const slotsAfterCancel = await getTimeSlots(gymHouse.id, auth.accessToken);
    const slotAfterCancel = slotsAfterCancel.find((s) => s.id === slot.id)!;
    expect(slotAfterCancel.currentBookings).toBe(0);
    expect(slotAfterCancel.availableSpots).toBe(slot.maxCapacity);
  });

  test("returns 404 when cancelling a non-existent booking", async () => {
    const { auth, gymHouse } = await setupBookingContext();

    const res = await apiRequestRaw(
      "DELETE",
      `/gymhouses/${gymHouse.id}/bookings/00000000-0000-0000-0000-000000000000`,
      undefined,
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// No-show flow
// ---------------------------------------------------------------------------

test.describe("No-show flow (API)", () => {
  test("marks a booking as no-show and status becomes NoShow", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    const booking = await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    await markNoShow(gymHouse.id, booking.id, auth.accessToken);

    const fetched = await getBookingById(gymHouse.id, booking.id, auth.accessToken);
    expect(fetched.status).toBe(2); // NoShow
  });
});

// ---------------------------------------------------------------------------
// Double booking prevention
// ---------------------------------------------------------------------------

test.describe("Double booking prevention (API)", () => {
  test("returns 409 when the same member books the same slot twice", async () => {
    const { auth, gymHouse, member, slot } = await setupBookingContext();

    await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    const res = await apiRequestRaw(
      "POST",
      `/gymhouses/${gymHouse.id}/bookings`,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Capacity enforcement
// ---------------------------------------------------------------------------

test.describe("Capacity enforcement (API)", () => {
  test("returns 409 when booking exceeds slot maxCapacity", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    // Create a slot with capacity of exactly 1
    const slot = await createTimeSlot(
      gymHouse.id,
      generateTimeSlot({ maxCapacity: 1 }),
      auth.accessToken,
    );

    // Create two members and subscribe both
    const memberA = await createMember(gymHouse.id, generateMember(), auth.accessToken);
    await createSubscription(gymHouse.id, memberA.id, generateSubscription(), auth.accessToken);

    const memberB = await createMember(gymHouse.id, generateMember(), auth.accessToken);
    await createSubscription(gymHouse.id, memberB.id, generateSubscription(), auth.accessToken);

    // First booking must succeed
    await createBooking(
      gymHouse.id,
      generateBooking({ memberId: memberA.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    // Second booking must be rejected (over capacity)
    const res = await apiRequestRaw(
      "POST",
      `/gymhouses/${gymHouse.id}/bookings`,
      generateBooking({ memberId: memberB.id, timeSlotId: slot.id }),
      auth.accessToken,
    );
    expect(res.status).toBe(409);
  });

  test("time slot reports zero available spots after reaching maxCapacity", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    const slot = await createTimeSlot(
      gymHouse.id,
      generateTimeSlot({ maxCapacity: 1 }),
      auth.accessToken,
    );

    const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
    await createSubscription(gymHouse.id, member.id, generateSubscription(), auth.accessToken);

    await createBooking(
      gymHouse.id,
      generateBooking({ memberId: member.id, timeSlotId: slot.id }),
      auth.accessToken,
    );

    const slots = await getTimeSlots(gymHouse.id, auth.accessToken);
    const updated = slots.find((s) => s.id === slot.id)!;
    expect(updated.availableSpots).toBe(0);
    expect(updated.currentBookings).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Class schedule CRUD
// ---------------------------------------------------------------------------

test.describe("Class schedule CRUD (API)", () => {
  test("creates a class schedule and returns full DTO", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    // Register a trainer user and use their ID
    const trainerUser = generateUser();
    const trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: null,
    });

    const payload = generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 1 });
    const schedule = await createClassSchedule(gymHouse.id, payload, auth.accessToken);

    expect(schedule.id).toBeTruthy();
    expect(schedule.gymHouseId).toBe(gymHouse.id);
    expect(schedule.className).toBe(payload.className);
    expect(schedule.dayOfWeek).toBe(payload.dayOfWeek);
    expect(schedule.maxCapacity).toBe(payload.maxCapacity);
  });

  test("lists class schedules for a gym house", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    const trainerUser = generateUser();
    const trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: null,
    });

    await createClassSchedule(
      gymHouse.id,
      generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 1 }),
      auth.accessToken,
    );
    await createClassSchedule(
      gymHouse.id,
      generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 3 }),
      auth.accessToken,
    );

    const all = await getClassSchedules(gymHouse.id, auth.accessToken);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  test("filters class schedules by dayOfWeek", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    const trainerUser = generateUser();
    const trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: null,
    });

    await createClassSchedule(
      gymHouse.id,
      generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 2 }),
      auth.accessToken,
    );
    await createClassSchedule(
      gymHouse.id,
      generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 5 }),
      auth.accessToken,
    );

    const tuesday = await getClassSchedules(gymHouse.id, auth.accessToken, { dayOfWeek: 2 });
    for (const s of tuesday) {
      expect(s.dayOfWeek).toBe(2);
    }
    const found = tuesday.some((s) => s.dayOfWeek === 5);
    expect(found).toBe(false);
  });

  test("updates a class schedule and returns updated DTO", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    const trainerUser = generateUser();
    const trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: null,
    });

    const schedule = await createClassSchedule(
      gymHouse.id,
      generateClassSchedule({ trainerId: trainerAuth.userId, dayOfWeek: 1 }),
      auth.accessToken,
    );

    const updatedPayload = {
      trainerId: trainerAuth.userId,
      className: "Updated Pilates",
      dayOfWeek: 4,
      startTime: "10:00:00",
      endTime: "11:00:00",
      maxCapacity: 25,
      isRecurring: false,
    };
    const updated = await (await import("../../helpers/api-client.js")).updateClassSchedule(
      gymHouse.id,
      schedule.id,
      updatedPayload,
      auth.accessToken,
    );

    expect(updated.id).toBe(schedule.id);
    expect(updated.className).toBe("Updated Pilates");
    expect(updated.dayOfWeek).toBe(4);
    expect(updated.maxCapacity).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Time slot listing with date range filter
// ---------------------------------------------------------------------------

test.describe("Time slot listing (API)", () => {
  test("lists time slots for a gym house", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(1) }), auth.accessToken);
    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(2) }), auth.accessToken);
    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(3) }), auth.accessToken);

    const slots = await getTimeSlots(gymHouse.id, auth.accessToken);
    expect(slots.length).toBeGreaterThanOrEqual(3);
  });

  test("filters time slots by date range", async () => {
    const user = generateUser();
    const auth = await register({
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      phone: null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(1) }), auth.accessToken);
    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(5) }), auth.accessToken);
    await createTimeSlot(gymHouse.id, generateTimeSlot({ date: offsetDate(10) }), auth.accessToken);

    const fromDate = offsetDate(1);
    const toDate = offsetDate(6);
    const slots = await getTimeSlots(gymHouse.id, auth.accessToken, {
      from: fromDate,
      to: toDate,
    });

    for (const slot of slots) {
      expect(slot.date >= fromDate).toBe(true);
      expect(slot.date <= toDate).toBe(true);
    }
    // The slot on day+10 must not appear
    const outsideRange = slots.find((s) => s.date === offsetDate(10));
    expect(outsideRange).toBeUndefined();
  });
});
