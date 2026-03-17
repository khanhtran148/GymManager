/**
 * Lightweight API client for direct API calls in E2E tests.
 * Uses native fetch() — no Playwright APIRequestContext required.
 * All routes match the live API contract (api-contract-260317-*.md).
 */

export const API_URL =
  process.env.API_URL ?? "http://localhost:5000/api/v1";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ProblemDetails {
  status: number;
  detail: string;
  instance?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface PagedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Request payload types
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateGymHouseRequest {
  name: string;
  address: string;
  phone?: string | null;
  operatingHours?: string | null;
  hourlyCapacity: number;
}

export interface CreateMemberRequest {
  email: string;
  fullName: string;
  phone?: string | null;
}

/** Monthly=0 Quarterly=1 Annual=2 Unlimited=3 PayPerClass=4 */
export type SubscriptionType = 0 | 1 | 2 | 3 | 4;

export interface CreateSubscriptionRequest {
  type: SubscriptionType;
  price: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}

export interface CreateTimeSlotRequest {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm:ss
  endTime: string;    // HH:mm:ss
  maxCapacity: number;
}

export interface CreateClassScheduleRequest {
  trainerId: string;
  className: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  maxCapacity: number;
  isRecurring: boolean;
}

/** TimeSlot=0 ClassSession=1 */
export type BookingType = 0 | 1;

export interface CreateBookingRequest {
  memberId: string;
  bookingType: BookingType;
  timeSlotId?: string | null;
  classScheduleId?: string | null;
}

/**
 * MembershipFee=0 SalaryPayment=1 Rent=2 Utilities=3
 * Equipment=4 Wages=5 Expense=6 Refund=7 Other=8
 */
export type TransactionType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Credit=0 Debit=1 */
export type TransactionDirection = 0 | 1;

export type TransactionCategory =
  | "Revenue"
  | "OperatingExpense"
  | "CapitalExpense"
  | "Payroll"
  | "Refund";

export type PaymentMethod = "Cash" | "BankTransfer" | "Card" | "Online";

export interface CreateTransactionRequest {
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  category: TransactionCategory;
  description: string;
  transactionDate: string; // ISO 8601 UTC
  relatedEntityId?: string | null;
  approvedById?: string | null;
  paymentMethod?: PaymentMethod | null;
  externalReference?: string | null;
}

/** Trainer=0 SecurityGuard=1 CleaningStaff=2 Reception=3 */
export type StaffType = 0 | 1 | 2 | 3;

export interface CreateStaffRequest {
  userId: string;
  gymHouseId: string;
  staffType: StaffType;
  baseSalary: number;
  perClassBonus: number;
}

export type TargetAudience =
  | "AllMembers"
  | "ActiveMembers"
  | "Staff"
  | "Trainers"
  | "Everyone";

export interface CreateAnnouncementRequest {
  gymHouseId: string | null;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string; // ISO 8601 UTC
}

// ---------------------------------------------------------------------------
// Response DTO types
// ---------------------------------------------------------------------------

export interface GymHouseDto {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  hourlyCapacity: number;
  ownerId: string;
  createdAt: string;
}

export interface MemberDto {
  id: string;
  gymHouseId: string;
  userId: string;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "Active" | "Frozen" | "Expired" | "Cancelled";
  joinedAt: string;
}

export interface SubscriptionDto {
  id: string;
  memberId: string;
  gymHouseId: string;
  type: string;
  status: "Active" | "Frozen" | "Expired" | "Cancelled";
  price: number;
  startDate: string;
  endDate: string;
  frozenAt: string | null;
  frozenUntil: string | null;
  createdAt: string;
}

export interface TimeSlotDto {
  id: string;
  gymHouseId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  availableSpots: number;
}

export interface ClassScheduleDto {
  id: string;
  gymHouseId: string;
  trainerId: string;
  trainerName: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  isRecurring: boolean;
}

export interface BookingDto {
  id: string;
  memberId: string;
  gymHouseId: string;
  bookingType: number;
  timeSlotId: string | null;
  classScheduleId: string | null;
  /** Confirmed=0 Cancelled=1 NoShow=2 Completed=3 WaitListed=4 */
  status: number;
  bookedAt: string;
  checkedInAt: string | null;
  checkInSource: number;
  memberName: string;
  memberCode: string;
}

export interface TransactionDto {
  id: string;
  gymHouseId: string;
  transactionType: string;
  direction: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  relatedEntityId: string | null;
  reversesTransactionId: string | null;
  reversedByTransactionId: string | null;
  approvedById: string | null;
  paymentMethod: string | null;
  externalReference: string | null;
  createdAt: string;
}

export interface StaffDto {
  id: string;
  userId: string;
  gymHouseId: string;
  staffType: string;
  baseSalary: number;
  perClassBonus: number;
  hiredAt: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  gymHouseId: string | null;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeader(token),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const problem = (await response.json()) as Partial<ProblemDetails>;
      if (problem.detail) detail = problem.detail;
    } catch {
      // keep the status string when body is not JSON
    }
    throw new Error(`[${method} ${url}] ${detail}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("POST", "/auth/register", payload);
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("POST", "/auth/login", payload);
}

// ---------------------------------------------------------------------------
// Gym Houses  — POST /gym-houses
// ---------------------------------------------------------------------------

export async function createGymHouse(
  payload: CreateGymHouseRequest,
  token: string,
): Promise<GymHouseDto> {
  return apiRequest<GymHouseDto>("POST", "/gym-houses", payload, token);
}

// ---------------------------------------------------------------------------
// Members  — POST /gym-houses/{gymHouseId}/members
// ---------------------------------------------------------------------------

export async function createMember(
  gymHouseId: string,
  payload: CreateMemberRequest,
  token: string,
): Promise<MemberDto> {
  return apiRequest<MemberDto>(
    "POST",
    `/gymhouses/${gymHouseId}/members`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Subscriptions  — POST /gym-houses/{gymHouseId}/members/{memberId}/subscriptions
// ---------------------------------------------------------------------------

export async function createSubscription(
  gymHouseId: string,
  memberId: string,
  payload: CreateSubscriptionRequest,
  token: string,
): Promise<SubscriptionDto> {
  return apiRequest<SubscriptionDto>(
    "POST",
    `/gymhouses/${gymHouseId}/members/${memberId}/subscriptions`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Time Slots  — POST /gym-houses/{gymHouseId}/time-slots
// ---------------------------------------------------------------------------

export async function createTimeSlot(
  gymHouseId: string,
  payload: CreateTimeSlotRequest,
  token: string,
): Promise<TimeSlotDto> {
  return apiRequest<TimeSlotDto>(
    "POST",
    `/gymhouses/${gymHouseId}/time-slots`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Class Schedules  — POST /gym-houses/{gymHouseId}/class-schedules
// ---------------------------------------------------------------------------

export async function createClassSchedule(
  gymHouseId: string,
  payload: CreateClassScheduleRequest,
  token: string,
): Promise<ClassScheduleDto> {
  return apiRequest<ClassScheduleDto>(
    "POST",
    `/gymhouses/${gymHouseId}/class-schedules`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Bookings  — POST /gym-houses/{gymHouseId}/bookings
// ---------------------------------------------------------------------------

export async function createBooking(
  gymHouseId: string,
  payload: CreateBookingRequest,
  token: string,
): Promise<BookingDto> {
  return apiRequest<BookingDto>(
    "POST",
    `/gymhouses/${gymHouseId}/bookings`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Transactions  — POST /gym-houses/{gymHouseId}/transactions
// ---------------------------------------------------------------------------

export async function createTransaction(
  gymHouseId: string,
  payload: CreateTransactionRequest,
  token: string,
): Promise<TransactionDto> {
  return apiRequest<TransactionDto>(
    "POST",
    `/gymhouses/${gymHouseId}/transactions`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Staff  — POST /staff
// ---------------------------------------------------------------------------

export async function createStaff(
  payload: CreateStaffRequest,
  token: string,
): Promise<StaffDto> {
  return apiRequest<StaffDto>("POST", "/staff", payload, token);
}

// ---------------------------------------------------------------------------
// Announcements  — POST /announcements
// ---------------------------------------------------------------------------

export async function createAnnouncement(
  payload: CreateAnnouncementRequest,
  token: string,
): Promise<AnnouncementDto> {
  return apiRequest<AnnouncementDto>("POST", "/announcements", payload, token);
}
