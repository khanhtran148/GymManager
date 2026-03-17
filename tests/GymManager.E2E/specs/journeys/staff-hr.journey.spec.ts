/**
 * Staff HR Journey
 *
 * Tests a complete staff HR workflow: registering a trainer, assigning shifts,
 * generating a payroll period, approving payroll, and broadcasting an
 * announcement to staff.
 * Each step builds on the previous one using shared state declared in the
 * describe scope. This is an API-only journey — no browser is involved.
 */

import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createStaff,
  createShiftAssignment,
  getShiftAssignments,
  createPayrollPeriod,
  getPayrollPeriodById,
  approvePayroll,
  createAnnouncement,
  AuthResponse,
  GymHouseDto,
  StaffDto,
  ShiftAssignmentDto,
  PayrollPeriodDetailDto,
  AnnouncementDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateStaff,
  generateShiftAssignment,
  generatePayrollPeriod,
  generateAnnouncement,
  offsetDate,
} from "../../helpers/test-data.js";

test.describe("Staff HR Journey", () => {
  let ownerAuth: AuthResponse;
  let gymHouse: GymHouseDto;
  let trainerAuth: AuthResponse;
  let staff: StaffDto;
  let morningShift: ShiftAssignmentDto;
  let afternoonShift: ShiftAssignmentDto;
  let payrollPeriod: PayrollPeriodDetailDto;
  let announcement: AnnouncementDto;

  test("Step 1: Owner registers and creates gym house", async () => {
    const ownerUser = generateUser();
    ownerAuth = await register({
      email: ownerUser.email,
      password: ownerUser.password,
      fullName: ownerUser.fullName,
      phone: null,
    });
    expect(ownerAuth.accessToken).toBeTruthy();
    expect(ownerAuth.userId).toBeTruthy();

    gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);
    expect(gymHouse.id).toBeTruthy();
    expect(gymHouse.ownerId).toBe(ownerAuth.userId);
  });

  test("Step 2: Register a trainer user", async () => {
    const trainerUser = generateUser();
    trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: null,
    });
    expect(trainerAuth.accessToken).toBeTruthy();
    expect(trainerAuth.userId).toBeTruthy();
  });

  test("Step 3: Owner creates Staff(Trainer) record for the trainer user", async () => {
    staff = await createStaff(
      generateStaff({
        userId: trainerAuth.userId,
        gymHouseId: gymHouse.id,
        staffType: 0, // Trainer
      }),
      ownerAuth.accessToken,
    );
    expect(staff.id).toBeTruthy();
    expect(staff.userId).toBe(trainerAuth.userId);
    expect(staff.gymHouseId).toBe(gymHouse.id);
    expect(staff.staffType).toBe("Trainer");
  });

  test("Step 4: Assign morning shift to trainer", async () => {
    morningShift = await createShiftAssignment(
      generateShiftAssignment({
        staffId: staff.id,
        gymHouseId: gymHouse.id,
        shiftDate: offsetDate(1),
        startTime: "06:00:00",
        endTime: "14:00:00",
        shiftType: 0, // Morning
      }),
      ownerAuth.accessToken,
    );
    expect(morningShift.id).toBeTruthy();
    expect(morningShift.staffId).toBe(staff.id);
    expect(morningShift.gymHouseId).toBe(gymHouse.id);
    expect(morningShift.shiftType).toBe("Morning");
  });

  test("Step 5: Assign afternoon shift to trainer", async () => {
    afternoonShift = await createShiftAssignment(
      generateShiftAssignment({
        staffId: staff.id,
        gymHouseId: gymHouse.id,
        shiftDate: offsetDate(2),
        startTime: "14:00:00",
        endTime: "22:00:00",
        shiftType: 1, // Afternoon
      }),
      ownerAuth.accessToken,
    );
    expect(afternoonShift.id).toBeTruthy();
    expect(afternoonShift.staffId).toBe(staff.id);
    expect(afternoonShift.gymHouseId).toBe(gymHouse.id);
    expect(afternoonShift.shiftType).toBe("Afternoon");
  });

  test("Step 6: Verify shift list shows both shifts", async () => {
    const shifts = await getShiftAssignments(ownerAuth.accessToken, {
      gymHouseId: gymHouse.id,
      staffId: staff.id,
    });
    const shiftIds = shifts.map((s) => s.id);
    expect(shiftIds).toContain(morningShift.id);
    expect(shiftIds).toContain(afternoonShift.id);
    expect(shifts.length).toBeGreaterThanOrEqual(2);
  });

  test("Step 7: Create payroll period for current month", async () => {
    payrollPeriod = await createPayrollPeriod(
      generatePayrollPeriod({ gymHouseId: gymHouse.id }),
      ownerAuth.accessToken,
    );
    expect(payrollPeriod.id).toBeTruthy();
    expect(payrollPeriod.gymHouseId).toBe(gymHouse.id);
    expect(payrollPeriod.status).toBe("Draft");
    expect(payrollPeriod.entries).toBeDefined();
  });

  test("Step 8: Verify payroll period detail contains trainer entry", async () => {
    const detail = await getPayrollPeriodById(
      payrollPeriod.id,
      gymHouse.id,
      ownerAuth.accessToken,
    );
    expect(detail.id).toBe(payrollPeriod.id);
    expect(detail.entries).toBeDefined();
    const trainerEntry = detail.entries.find((e) => e.staffId === staff.id);
    expect(trainerEntry).toBeDefined();
    expect(trainerEntry!.staffName).toBeTruthy();
  });

  test("Step 9: Approve payroll period", async () => {
    const approved = await approvePayroll(
      payrollPeriod.id,
      gymHouse.id,
      ownerAuth.accessToken,
    );
    expect(approved.id).toBe(payrollPeriod.id);
    expect(approved.status).toBe("Approved");
    expect(approved.approvedById).toBe(ownerAuth.userId);
    expect(approved.approvedAt).toBeTruthy();
  });

  test("Step 10: Create announcement for Staff audience", async () => {
    announcement = await createAnnouncement(
      generateAnnouncement({
        gymHouseId: gymHouse.id,
        targetAudience: "Staff",
      }),
      ownerAuth.accessToken,
    );
    expect(announcement.id).toBeTruthy();
    expect(announcement.gymHouseId).toBe(gymHouse.id);
    expect(announcement.targetAudience).toBe("Staff");
    expect(announcement.authorId).toBe(ownerAuth.userId);
  });
});
