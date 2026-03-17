/**
 * Playwright fixture that provides:
 *   - `authenticatedPage`  — a Page already logged in (per-test fresh user)
 *   - `apiContext`         — { token, userId, email } plus typed API helper methods
 *
 * A brand-new user is registered via the API before each test so tests are
 * fully isolated and share no state. The token is injected into localStorage;
 * if the app redirects back to /login a form-login fallback is performed.
 *
 * Export the extended `test` and re-export `expect` so specs can do:
 *   import { test, expect } from "@fixtures/auth.fixture.js";
 */

import { test as base, expect, Page } from "@playwright/test";
import {
  register,
  login,
  createGymHouse,
  createMember,
  createSubscription,
  createTimeSlot,
  createClassSchedule,
  createBooking,
  createTransaction,
  createStaff,
  createAnnouncement,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  SubscriptionDto,
  TimeSlotDto,
  ClassScheduleDto,
  BookingDto,
  TransactionDto,
  StaffDto,
  AnnouncementDto,
  CreateGymHouseRequest,
  CreateMemberRequest,
  CreateSubscriptionRequest,
  CreateTimeSlotRequest,
  CreateClassScheduleRequest,
  CreateBookingRequest,
  CreateTransactionRequest,
  CreateStaffRequest,
  CreateAnnouncementRequest,
} from "../helpers/api-client.js";
import { generateUser } from "../helpers/test-data.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Provides a token and typed wrappers for every API mutation so specs can
 * seed data without constructing raw fetch calls.
 */
export interface ApiContext {
  readonly token: string;
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;

  createGymHouse(payload: CreateGymHouseRequest): Promise<GymHouseDto>;
  createMember(gymHouseId: string, payload: CreateMemberRequest): Promise<MemberDto>;
  createSubscription(
    gymHouseId: string,
    memberId: string,
    payload: CreateSubscriptionRequest,
  ): Promise<SubscriptionDto>;
  createTimeSlot(gymHouseId: string, payload: CreateTimeSlotRequest): Promise<TimeSlotDto>;
  createClassSchedule(
    gymHouseId: string,
    payload: CreateClassScheduleRequest,
  ): Promise<ClassScheduleDto>;
  createBooking(gymHouseId: string, payload: CreateBookingRequest): Promise<BookingDto>;
  createTransaction(
    gymHouseId: string,
    payload: CreateTransactionRequest,
  ): Promise<TransactionDto>;
  createStaff(payload: CreateStaffRequest): Promise<StaffDto>;
  createAnnouncement(payload: CreateAnnouncementRequest): Promise<AnnouncementDto>;
}

export interface AuthFixtures {
  /**
   * Full auth response for the test user (userId, email, accessToken, …).
   * The user is registered fresh for every test.
   */
  authResponse: AuthResponse;

  /** Raw JWT access token string — shorthand for authResponse.accessToken */
  authToken: string;

  /**
   * A Playwright Page that is already authenticated as the test user.
   * Auth state is injected into localStorage; the fixture falls back to
   * form-based login if the app redirects to /login after injection.
   */
  authenticatedPage: Page;

  /** Object with token + typed API helper methods for data seeding */
  apiContext: ApiContext;
}

// ---------------------------------------------------------------------------
// Fixture implementation
// ---------------------------------------------------------------------------

export const test = base.extend<AuthFixtures>({
  // 1. Register a fresh user and store the AuthResponse
  authResponse: async ({}, use) => {
    const userData = generateUser();
    const auth = await register({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone ?? null,
    });
    await use(auth);
  },

  // 2. Shortcut to the raw JWT string
  authToken: async ({ authResponse }, use) => {
    await use(authResponse.accessToken);
  },

  // 3. Typed API helper object
  apiContext: async ({ authResponse }, use) => {
    const token = authResponse.accessToken;

    const ctx: ApiContext = {
      token,
      userId: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,

      createGymHouse: (p) => createGymHouse(p, token),
      createMember: (gymHouseId, p) => createMember(gymHouseId, p, token),
      createSubscription: (gymHouseId, memberId, p) =>
        createSubscription(gymHouseId, memberId, p, token),
      createTimeSlot: (gymHouseId, p) => createTimeSlot(gymHouseId, p, token),
      createClassSchedule: (gymHouseId, p) => createClassSchedule(gymHouseId, p, token),
      createBooking: (gymHouseId, p) => createBooking(gymHouseId, p, token),
      createTransaction: (gymHouseId, p) => createTransaction(gymHouseId, p, token),
      createStaff: (p) => createStaff(p, token),
      createAnnouncement: (p) => createAnnouncement(p, token),
    };

    await use(ctx);
  },

  // 4. Authenticated browser page
  authenticatedPage: async ({ page, authResponse }, use) => {
    // Navigate to the origin so localStorage writes are on the same origin.
    await page.goto("/login");

    // Inject auth tokens into the storage keys the Next.js app reads.
    // If the app uses different keys, adjust the key names here — the shape
    // of AuthResponse never changes.
    // Inject auth state into localStorage (Zustand persist) and set the
    // is_authenticated cookie that Next.js middleware reads for route guards.
    await page.evaluate(
      ({ auth }: { auth: AuthResponse }) => {
        localStorage.setItem("access_token", auth.accessToken);
        localStorage.setItem("refresh_token", auth.refreshToken);

        // Zustand persist store format
        const zustandState = JSON.stringify({
          state: {
            user: { userId: auth.userId, email: auth.email, fullName: auth.fullName },
            token: auth.accessToken,
            isAuthenticated: true,
          },
          version: 0,
        });
        localStorage.setItem("auth-storage", zustandState);

        // Cookie for Next.js middleware
        document.cookie = "is_authenticated=1; path=/; max-age=604800; SameSite=Lax";
      },
      { auth: authResponse },
    );

    // Navigate to root and let the React/Next app hydrate with the stored token.
    await page.goto("/");

    // Fallback: if the app still lands on /login (e.g. it uses httpOnly cookies
    // or a different storage mechanism) fill the login form instead.
    if (page.url().includes("/login")) {
      await page.getByLabel(/email/i).fill(authResponse.email);
      // Every test user is registered with the fixed password "Test@1234".
      await page.getByLabel(/^password/i).fill("Test@1234");
      await page.getByRole("button", { name: /login|sign in/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 15_000,
      });
    }

    await use(page);
  },
});

export { expect };
