export type StaffType = "Trainer" | "SecurityGuard" | "CleaningStaff" | "Reception";

export type ShiftType = "Morning" | "Afternoon" | "Evening" | "Night";

export type ShiftStatus = "Scheduled" | "Completed" | "Absent";

export type PayrollStatus = "Draft" | "PendingApproval" | "Approved" | "Paid";

export interface StaffDto {
  id: string;
  userId: string;
  gymHouseId: string;
  staffType: StaffType;
  baseSalary: number;
  perClassBonus: number;
  hiredAt: string;
  userName: string;
  userEmail: string;
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
  shiftType: ShiftType;
  status: ShiftStatus;
  createdAt: string;
}

export interface PayrollPeriodDto {
  id: string;
  gymHouseId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  approvedById: string | null;
  approvedAt: string | null;
  totalNetPay: number;
  entryCount: number;
  createdAt: string;
}

export interface PayrollEntryDto {
  id: string;
  payrollPeriodId: string;
  staffId: string;
  staffName: string;
  staffType: StaffType;
  basePay: number;
  classBonus: number;
  deductions: number;
  netPay: number;
  classesTaught: number;
}

export interface PayrollPeriodDetailDto {
  id: string;
  gymHouseId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  approvedById: string | null;
  approvedAt: string | null;
  entries: PayrollEntryDto[];
  totalNetPay: number;
  createdAt: string;
}

export interface CreateStaffRequest {
  userId: string;
  gymHouseId: string;
  staffType: StaffType;
  baseSalary: number;
  perClassBonus: number;
}

export interface UpdateStaffRequest {
  staffType: StaffType;
  baseSalary: number;
  perClassBonus: number;
}

export interface CreateShiftAssignmentRequest {
  staffId: string;
  gymHouseId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
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
  periodStart: string;
  periodEnd: string;
}
