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

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateGymHouseRequest {
  name: string;
  address: string;
  phone?: string | null;
  operatingHours?: string | null;
  hourlyCapacity: number;
}

export interface UpdateMemberRequest {
  fullName: string;
  phone?: string | null;
}

export interface FreezeSubscriptionRequest {
  gymHouseId: string;
  frozenUntil: string; // ISO 8601
}

export interface CancelSubscriptionRequest {
  gymHouseId: string;
}

export interface RenewSubscriptionRequest {
  gymHouseId: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  price: number;
}

export interface UpdateClassScheduleRequest {
  trainerId: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isRecurring: boolean;
}

export interface CheckInRequest {
  source: number; // QRScan=0, ManualByStaff=1, SelfKiosk=2
}

export interface UpdateStaffRequest {
  staffType: StaffType;
  baseSalary: number;
  perClassBonus: number;
}

/** Morning=0 Afternoon=1 Evening=2 Night=3 */
export type ShiftType = 0 | 1 | 2 | 3;

/** Scheduled=0 Completed=1 Absent=2 */
export type ShiftStatus = 0 | 1 | 2;

export interface CreateShiftAssignmentRequest {
  staffId: string;
  gymHouseId: string;
  shiftDate: string;   // YYYY-MM-DD
  startTime: string;   // HH:mm:ss
  endTime: string;     // HH:mm:ss
  shiftType: ShiftType;
}

export interface UpdateShiftAssignmentRequest {
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
}

export interface CreatePayrollPeriodRequest {
  gymHouseId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
}

/** InApp=0 Push=1 Email=2 */
export type NotificationChannel = 0 | 1 | 2;

export interface UpdateNotificationPreferencesRequest {
  preferences: Array<{ channel: NotificationChannel; isEnabled: boolean }>;
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

export interface ShiftAssignmentDto {
  id: string;
  staffId: string;
  gymHouseId: string;
  staffName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  createdAt: string;
}

export interface PayrollEntryDto {
  id: string;
  payrollPeriodId: string;
  staffId: string;
  staffName: string;
  staffType: string;
  basePay: number;
  classBonus: number;
  deductions: number;
  netPay: number;
  classesTaught: number;
}

export interface PayrollPeriodDto {
  id: string;
  gymHouseId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  totalNetPay: number;
  entryCount: number;
  createdAt: string;
}

export interface PayrollPeriodDetailDto extends PayrollPeriodDto {
  entries: PayrollEntryDto[];
}

export interface NotificationDto {
  id: string;
  announcementId: string;
  announcementTitle: string;
  announcementContent: string;
  channel: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
}

export interface NotificationPreferenceDto {
  channel: string;
  isEnabled: boolean;
}

export interface PnLLineDto {
  category: string;
  totalAmount: number;
}

export interface PnLReportDto {
  gymHouseId: string;
  from: string;
  to: string;
  incomeLines: PnLLineDto[];
  expenseLines: PnLLineDto[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface RevenueMetricsDto {
  gymHouseId: string;
  from: string;
  to: string;
  mrr: number;
  churnRate: number;
  avgRevenuePerMember: number;
  totalRevenue: number;
  activeMembers: number;
  cancelledSubscriptions: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequestRaw(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<Response> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeader(token),
  };

  return fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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

// ---------------------------------------------------------------------------
// Auth (extended)
// ---------------------------------------------------------------------------

export async function refreshToken(
  payload: RefreshTokenRequest,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("POST", "/auth/refresh", payload);
}

// ---------------------------------------------------------------------------
// Gym Houses (extended)
// ---------------------------------------------------------------------------

export async function getGymHouses(token: string): Promise<GymHouseDto[]> {
  return apiRequest<GymHouseDto[]>("GET", "/gym-houses", undefined, token);
}

export async function getGymHouseById(
  id: string,
  token: string,
): Promise<GymHouseDto> {
  return apiRequest<GymHouseDto>("GET", `/gym-houses/${id}`, undefined, token);
}

export async function updateGymHouse(
  id: string,
  payload: UpdateGymHouseRequest,
  token: string,
): Promise<GymHouseDto> {
  return apiRequest<GymHouseDto>("PUT", `/gym-houses/${id}`, payload, token);
}

export async function deleteGymHouse(
  id: string,
  token: string,
): Promise<void> {
  return apiRequest<void>("DELETE", `/gym-houses/${id}`, undefined, token);
}

// ---------------------------------------------------------------------------
// Members (extended)
// ---------------------------------------------------------------------------

export async function getMembers(
  gymHouseId: string,
  token: string,
  params?: { page?: number; pageSize?: number; search?: string },
): Promise<PagedList<MemberDto>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<MemberDto>>(
    "GET",
    `/gymhouses/${gymHouseId}/members${query}`,
    undefined,
    token,
  );
}

export async function getMemberById(
  gymHouseId: string,
  id: string,
  token: string,
): Promise<MemberDto> {
  return apiRequest<MemberDto>(
    "GET",
    `/gymhouses/${gymHouseId}/members/${id}`,
    undefined,
    token,
  );
}

export async function updateMember(
  gymHouseId: string,
  id: string,
  payload: UpdateMemberRequest,
  token: string,
): Promise<MemberDto> {
  return apiRequest<MemberDto>(
    "PUT",
    `/gymhouses/${gymHouseId}/members/${id}`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Subscriptions (extended)
// ---------------------------------------------------------------------------

export async function getSubscriptionsByMember(
  gymHouseId: string,
  memberId: string,
  token: string,
): Promise<SubscriptionDto[]> {
  return apiRequest<SubscriptionDto[]>(
    "GET",
    `/gymhouses/${gymHouseId}/members/${memberId}/subscriptions`,
    undefined,
    token,
  );
}

export async function freezeSubscription(
  id: string,
  payload: FreezeSubscriptionRequest,
  token: string,
): Promise<SubscriptionDto> {
  return apiRequest<SubscriptionDto>(
    "POST",
    `/subscriptions/${id}/freeze`,
    payload,
    token,
  );
}

export async function cancelSubscription(
  id: string,
  payload: CancelSubscriptionRequest,
  token: string,
): Promise<SubscriptionDto> {
  return apiRequest<SubscriptionDto>(
    "POST",
    `/subscriptions/${id}/cancel`,
    payload,
    token,
  );
}

export async function renewSubscription(
  id: string,
  payload: RenewSubscriptionRequest,
  token: string,
): Promise<SubscriptionDto> {
  return apiRequest<SubscriptionDto>(
    "POST",
    `/subscriptions/${id}/renew`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Time Slots (extended)
// ---------------------------------------------------------------------------

export async function getTimeSlots(
  gymHouseId: string,
  token: string,
  params?: { from?: string; to?: string },
): Promise<TimeSlotDto[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<TimeSlotDto[]>(
    "GET",
    `/gymhouses/${gymHouseId}/time-slots${query}`,
    undefined,
    token,
  );
}

// ---------------------------------------------------------------------------
// Class Schedules (extended)
// ---------------------------------------------------------------------------

export async function getClassSchedules(
  gymHouseId: string,
  token: string,
  params?: { dayOfWeek?: number },
): Promise<ClassScheduleDto[]> {
  const qs = new URLSearchParams();
  if (params?.dayOfWeek !== undefined) qs.set("dayOfWeek", String(params.dayOfWeek));
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<ClassScheduleDto[]>(
    "GET",
    `/gymhouses/${gymHouseId}/class-schedules${query}`,
    undefined,
    token,
  );
}

export async function getClassScheduleById(
  gymHouseId: string,
  id: string,
  token: string,
): Promise<ClassScheduleDto> {
  return apiRequest<ClassScheduleDto>(
    "GET",
    `/gymhouses/${gymHouseId}/class-schedules/${id}`,
    undefined,
    token,
  );
}

export async function updateClassSchedule(
  gymHouseId: string,
  id: string,
  payload: UpdateClassScheduleRequest,
  token: string,
): Promise<ClassScheduleDto> {
  return apiRequest<ClassScheduleDto>(
    "PUT",
    `/gymhouses/${gymHouseId}/class-schedules/${id}`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Bookings (extended)
// ---------------------------------------------------------------------------

export async function getBookings(
  gymHouseId: string,
  token: string,
  params?: { page?: number; pageSize?: number; from?: string; to?: string },
): Promise<PagedList<BookingDto>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<BookingDto>>(
    "GET",
    `/gymhouses/${gymHouseId}/bookings${query}`,
    undefined,
    token,
  );
}

export async function getBookingById(
  gymHouseId: string,
  id: string,
  token: string,
): Promise<BookingDto> {
  return apiRequest<BookingDto>(
    "GET",
    `/gymhouses/${gymHouseId}/bookings/${id}`,
    undefined,
    token,
  );
}

export async function cancelBooking(
  gymHouseId: string,
  id: string,
  token: string,
): Promise<void> {
  return apiRequest<void>(
    "DELETE",
    `/gymhouses/${gymHouseId}/bookings/${id}`,
    undefined,
    token,
  );
}

export async function checkInBooking(
  gymHouseId: string,
  id: string,
  payload: CheckInRequest,
  token: string,
): Promise<BookingDto> {
  return apiRequest<BookingDto>(
    "PATCH",
    `/gymhouses/${gymHouseId}/bookings/${id}/check-in`,
    payload,
    token,
  );
}

export async function markNoShow(
  gymHouseId: string,
  id: string,
  token: string,
): Promise<void> {
  return apiRequest<void>(
    "PATCH",
    `/gymhouses/${gymHouseId}/bookings/${id}/no-show`,
    undefined,
    token,
  );
}

// ---------------------------------------------------------------------------
// Transactions (extended)
// ---------------------------------------------------------------------------

export async function getTransactions(
  gymHouseId: string,
  token: string,
  params?: {
    page?: number;
    pageSize?: number;
    type?: number;
    direction?: number;
    from?: string;
    to?: string;
  },
): Promise<PagedList<TransactionDto>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.type !== undefined) qs.set("type", String(params.type));
  if (params?.direction !== undefined) qs.set("direction", String(params.direction));
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<TransactionDto>>(
    "GET",
    `/gymhouses/${gymHouseId}/transactions${query}`,
    undefined,
    token,
  );
}

export async function reverseTransaction(
  gymHouseId: string,
  id: string,
  reason: string,
  token: string,
): Promise<TransactionDto> {
  return apiRequest<TransactionDto>(
    "POST",
    `/gymhouses/${gymHouseId}/transactions/${id}/reverse`,
    { reason },
    token,
  );
}

// ---------------------------------------------------------------------------
// Staff (extended)
// ---------------------------------------------------------------------------

export async function getStaff(
  token: string,
  params?: { gymHouseId?: string; page?: number; pageSize?: number; staffType?: number },
): Promise<PagedList<StaffDto>> {
  const qs = new URLSearchParams();
  if (params?.gymHouseId) qs.set("gymHouseId", params.gymHouseId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.staffType !== undefined) qs.set("staffType", String(params.staffType));
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<StaffDto>>(
    "GET",
    `/staff${query}`,
    undefined,
    token,
  );
}

export async function getStaffById(
  id: string,
  gymHouseId: string,
  token: string,
): Promise<StaffDto> {
  return apiRequest<StaffDto>(
    "GET",
    `/staff/${id}?gymHouseId=${gymHouseId}`,
    undefined,
    token,
  );
}

export async function updateStaff(
  id: string,
  gymHouseId: string,
  payload: UpdateStaffRequest,
  token: string,
): Promise<StaffDto> {
  return apiRequest<StaffDto>(
    "PUT",
    `/staff/${id}?gymHouseId=${gymHouseId}`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Shift Assignments
// ---------------------------------------------------------------------------

export async function createShiftAssignment(
  payload: CreateShiftAssignmentRequest,
  token: string,
): Promise<ShiftAssignmentDto> {
  return apiRequest<ShiftAssignmentDto>(
    "POST",
    "/shift-assignments",
    payload,
    token,
  );
}

export async function getShiftAssignments(
  token: string,
  params?: { gymHouseId?: string; from?: string; to?: string; staffId?: string },
): Promise<ShiftAssignmentDto[]> {
  const qs = new URLSearchParams();
  if (params?.gymHouseId) qs.set("gymHouseId", params.gymHouseId);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.staffId) qs.set("staffId", params.staffId);
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<ShiftAssignmentDto[]>(
    "GET",
    `/shift-assignments${query}`,
    undefined,
    token,
  );
}

export async function updateShiftAssignment(
  id: string,
  gymHouseId: string,
  payload: UpdateShiftAssignmentRequest,
  token: string,
): Promise<ShiftAssignmentDto> {
  return apiRequest<ShiftAssignmentDto>(
    "PUT",
    `/shift-assignments/${id}?gymHouseId=${gymHouseId}`,
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export async function createPayrollPeriod(
  payload: CreatePayrollPeriodRequest,
  token: string,
): Promise<PayrollPeriodDetailDto> {
  return apiRequest<PayrollPeriodDetailDto>(
    "POST",
    "/payroll-periods",
    payload,
    token,
  );
}

export async function getPayrollPeriods(
  gymHouseId: string,
  token: string,
  params?: { page?: number; pageSize?: number },
): Promise<PagedList<PayrollPeriodDto>> {
  const qs = new URLSearchParams();
  qs.set("gymHouseId", gymHouseId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  return apiRequest<PagedList<PayrollPeriodDto>>(
    "GET",
    `/payroll-periods?${qs}`,
    undefined,
    token,
  );
}

export async function getPayrollPeriodById(
  id: string,
  gymHouseId: string,
  token: string,
): Promise<PayrollPeriodDetailDto> {
  return apiRequest<PayrollPeriodDetailDto>(
    "GET",
    `/payroll-periods/${id}?gymHouseId=${gymHouseId}`,
    undefined,
    token,
  );
}

export async function approvePayroll(
  id: string,
  gymHouseId: string,
  token: string,
): Promise<PayrollPeriodDetailDto> {
  return apiRequest<PayrollPeriodDetailDto>(
    "PATCH",
    `/payroll-periods/${id}/approve?gymHouseId=${gymHouseId}`,
    undefined,
    token,
  );
}

// ---------------------------------------------------------------------------
// Announcements (extended)
// ---------------------------------------------------------------------------

export async function getAnnouncements(
  token: string,
  params?: { gymHouseId?: string; page?: number; pageSize?: number },
): Promise<PagedList<AnnouncementDto>> {
  const qs = new URLSearchParams();
  if (params?.gymHouseId) qs.set("gymHouseId", params.gymHouseId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<AnnouncementDto>>(
    "GET",
    `/announcements${query}`,
    undefined,
    token,
  );
}

export async function getAnnouncementById(
  id: string,
  gymHouseId: string,
  token: string,
): Promise<AnnouncementDto> {
  return apiRequest<AnnouncementDto>(
    "GET",
    `/announcements/${id}?gymHouseId=${gymHouseId}`,
    undefined,
    token,
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(
  token: string,
  params?: { page?: number; pageSize?: number },
): Promise<PagedList<NotificationDto>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString() ? `?${qs}` : "";
  return apiRequest<PagedList<NotificationDto>>(
    "GET",
    `/notifications${query}`,
    undefined,
    token,
  );
}

export async function markNotificationRead(
  id: string,
  token: string,
): Promise<void> {
  return apiRequest<void>(
    "PATCH",
    `/notifications/${id}/read`,
    undefined,
    token,
  );
}

export async function getNotificationPreferences(
  token: string,
): Promise<NotificationPreferenceDto[]> {
  return apiRequest<NotificationPreferenceDto[]>(
    "GET",
    "/notification-preferences",
    undefined,
    token,
  );
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesRequest,
  token: string,
): Promise<void> {
  return apiRequest<void>(
    "PUT",
    "/notification-preferences",
    payload,
    token,
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getPnLReport(
  gymHouseId: string,
  from: string,
  to: string,
  token: string,
): Promise<PnLReportDto> {
  return apiRequest<PnLReportDto>(
    "GET",
    `/gymhouses/${gymHouseId}/reports/pnl?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    undefined,
    token,
  );
}

export async function getRevenueMetrics(
  gymHouseId: string,
  from: string,
  to: string,
  token: string,
): Promise<RevenueMetricsDto> {
  return apiRequest<RevenueMetricsDto>(
    "GET",
    `/gymhouses/${gymHouseId}/reports/revenue-metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    undefined,
    token,
  );
}
