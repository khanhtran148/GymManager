/**
 * Factory functions that produce unique, valid API request payloads.
 * Uniqueness is achieved with Date.now() + random suffix so parallel test
 * runs do not collide on email/name uniqueness constraints.
 *
 * All payload shapes match the live API contract (api-contract-260317-*.md).
 */

import type {
  RegisterRequest,
  CreateGymHouseRequest,
  CreateMemberRequest,
  CreateSubscriptionRequest,
  CreateTimeSlotRequest,
  CreateClassScheduleRequest,
  CreateBookingRequest,
  CreateTransactionRequest,
  CreateStaffRequest,
  CreateAnnouncementRequest,
  SubscriptionType,
  TransactionType,
  TransactionDirection,
  TransactionCategory,
  StaffType,
  TargetAudience,
} from "./api-client.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Collision-resistant suffix for test isolation */
function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Returns a date string in YYYY-MM-DD format offset by `days` from today (UTC) */
export function offsetDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Returns ISO 8601 UTC string offset by `days` from today (midnight UTC) */
export function offsetIso(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// User / Auth
// ---------------------------------------------------------------------------

/**
 * Generates a unique user payload for POST /auth/register.
 * Also includes `confirmPassword` which the frontend form requires.
 */
export function generateUser(
  overrides: Partial<RegisterRequest & { confirmPassword: string }> = {},
): RegisterRequest & { confirmPassword: string } {
  const id = uid();
  return {
    email: `user.${id}@test.example`,
    password: "Test@1234",
    fullName: `Test User ${id}`,
    phone: null,
    confirmPassword: "Test@1234",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Gym House
// ---------------------------------------------------------------------------

/**
 * Generates a unique gym house payload for POST /gymhouses.
 */
export function generateGymHouse(
  overrides: Partial<CreateGymHouseRequest> = {},
): CreateGymHouseRequest {
  const id = uid();
  const digits = id.replace(/[^0-9]/g, "0").slice(0, 7).padStart(7, "0");
  return {
    name: `Gym House ${id}`,
    address: `${id} Fitness Street, District 1, Ho Chi Minh City`,
    phone: `090${digits}`,
    operatingHours: "06:00-22:00",
    hourlyCapacity: 30,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------

/**
 * Generates a unique member payload for
 * POST /gymhouses/{gymHouseId}/members.
 */
export function generateMember(
  overrides: Partial<CreateMemberRequest> = {},
): CreateMemberRequest {
  const id = uid();
  const digits = id.replace(/[^0-9]/g, "0").slice(0, 7).padStart(7, "0");
  return {
    email: `member.${id}@test.example`,
    fullName: `Member ${id}`,
    phone: `091${digits}`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

/**
 * Generates a monthly subscription payload starting today for 30 days.
 * Suitable for POST /gymhouses/{id}/members/{id}/subscriptions.
 */
export function generateSubscription(
  overrides: Partial<CreateSubscriptionRequest> = {},
): CreateSubscriptionRequest {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + 1);
  return {
    type: 0 as SubscriptionType, // Monthly
    price: 500_000,
    startDate: today.toISOString(),
    endDate: end.toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Time Slot
// ---------------------------------------------------------------------------

/**
 * Generates a time slot for tomorrow between 07:00 and 08:00.
 * Suitable for POST /gymhouses/{gymHouseId}/time-slots.
 */
export function generateTimeSlot(
  overrides: Partial<CreateTimeSlotRequest> = {},
): CreateTimeSlotRequest {
  return {
    date: offsetDate(1),
    startTime: "07:00:00",
    endTime: "08:00:00",
    maxCapacity: 20,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Class Schedule
// ---------------------------------------------------------------------------

/**
 * Generates a class schedule payload.
 * Suitable for POST /gymhouses/{gymHouseId}/class-schedules.
 * Pass `trainerId` in overrides (or set it after calling this function).
 */
export function generateClassSchedule(
  overrides: Partial<CreateClassScheduleRequest> = {},
): CreateClassScheduleRequest {
  const id = uid();
  return {
    trainerId: "00000000-0000-0000-0000-000000000000",
    className: `Yoga ${id}`,
    dayOfWeek: 1, // Monday
    startTime: "09:00:00",
    endTime: "10:00:00",
    maxCapacity: 15,
    isRecurring: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

/**
 * Generates a time-slot booking payload.
 * Suitable for POST /gymhouses/{gymHouseId}/bookings.
 * Pass `memberId` and `timeSlotId` in overrides.
 */
export function generateBooking(
  overrides: Partial<CreateBookingRequest> = {},
): CreateBookingRequest {
  return {
    memberId: "00000000-0000-0000-0000-000000000000",
    bookingType: 0 as 0, // TimeSlot
    timeSlotId: null,
    classScheduleId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

/**
 * Generates a membership-fee credit transaction for today.
 * Suitable for POST /gymhouses/{gymHouseId}/transactions.
 */
export function generateTransaction(
  overrides: Partial<CreateTransactionRequest> = {},
): CreateTransactionRequest {
  const id = uid();
  return {
    transactionType: 0 as TransactionType, // MembershipFee
    direction: 0 as TransactionDirection,   // Credit
    amount: 1_000_000,
    category: "Revenue" as TransactionCategory,
    description: `Membership payment ${id}`,
    transactionDate: new Date().toISOString(),
    relatedEntityId: null,
    approvedById: null,
    paymentMethod: "Cash",
    externalReference: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/**
 * Generates a trainer staff payload.
 * Suitable for POST /staff.
 * Pass `userId` and `gymHouseId` in overrides.
 */
export function generateStaff(
  overrides: Partial<CreateStaffRequest> = {},
): CreateStaffRequest {
  return {
    userId: "00000000-0000-0000-0000-000000000000",
    gymHouseId: "00000000-0000-0000-0000-000000000000",
    staffType: 0 as StaffType, // Trainer
    baseSalary: 8_000_000,
    perClassBonus: 150_000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------

/**
 * Generates an announcement payload scheduled 5 minutes from now.
 * Suitable for POST /announcements.
 * Pass `gymHouseId` in overrides (null = chain-wide, requires Owner role).
 */
export function generateAnnouncement(
  overrides: Partial<CreateAnnouncementRequest> = {},
): CreateAnnouncementRequest {
  const id = uid();
  const publishAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  return {
    gymHouseId: null,
    title: `Announcement ${id}`,
    content: `Test announcement content ${id}. Please read carefully.`,
    targetAudience: "AllMembers" as TargetAudience,
    publishAt,
    ...overrides,
  };
}
