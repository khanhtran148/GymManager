import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  createShiftAssignment,
  getShiftAssignments,
  updateShiftAssignment,
  createPayrollPeriod,
  getPayrollPeriods,
  getPayrollPeriodById,
  approvePayroll,
  apiRequestRaw,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateStaff,
  generateShiftAssignment,
  generatePayrollPeriod,
  offsetDate,
} from "../../helpers/test-data.js";

test.describe("Staff HR (API)", () => {
  test.describe("Staff CRUD", () => {
    test("creates a Trainer staff record and returns a StaffDto", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
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

      const staff = await createStaff(
        generateStaff({
          userId: trainerAuth.userId,
          gymHouseId: gymHouse.id,
          staffType: 0, // Trainer
        }),
        auth.accessToken,
      );

      expect(staff.id).toBeTruthy();
      expect(staff.userId).toBe(trainerAuth.userId);
      expect(staff.gymHouseId).toBe(gymHouse.id);
      expect(staff.staffType).toMatch(/trainer/i);
    });

    test("creates a Reception staff record with staffType=3", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const receptionUser = generateUser();
      const receptionAuth = await register({
        email: receptionUser.email,
        password: receptionUser.password,
        fullName: receptionUser.fullName,
        phone: null,
      });

      const staff = await createStaff(
        generateStaff({
          userId: receptionAuth.userId,
          gymHouseId: gymHouse.id,
          staffType: 3, // Reception
        }),
        auth.accessToken,
      );

      expect(staff.id).toBeTruthy();
      expect(staff.staffType).toMatch(/reception/i);
    });

    test("lists staff filtered by gymHouseId", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouseA = await createGymHouse(generateGymHouse(), auth.accessToken);
      const gymHouseB = await createGymHouse(generateGymHouse(), auth.accessToken);

      const userA = generateUser();
      const authA = await register({
        email: userA.email,
        password: userA.password,
        fullName: userA.fullName,
        phone: null,
      });
      const userB = generateUser();
      const authB = await register({
        email: userB.email,
        password: userB.password,
        fullName: userB.fullName,
        phone: null,
      });

      const staffA = await createStaff(
        generateStaff({ userId: authA.userId, gymHouseId: gymHouseA.id }),
        auth.accessToken,
      );
      await createStaff(
        generateStaff({ userId: authB.userId, gymHouseId: gymHouseB.id }),
        auth.accessToken,
      );

      const result = await getStaff(auth.accessToken, { gymHouseId: gymHouseA.id });

      const ids = result.items.map((s) => s.id);
      expect(ids).toContain(staffA.id);
      expect(ids).not.toContain(authB.userId);
    });

    test("lists staff filtered by staffType", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
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
      const receptionUser = generateUser();
      const receptionAuth = await register({
        email: receptionUser.email,
        password: receptionUser.password,
        fullName: receptionUser.fullName,
        phone: null,
      });

      const trainer = await createStaff(
        generateStaff({ userId: trainerAuth.userId, gymHouseId: gymHouse.id, staffType: 0 }),
        auth.accessToken,
      );
      const reception = await createStaff(
        generateStaff({ userId: receptionAuth.userId, gymHouseId: gymHouse.id, staffType: 3 }),
        auth.accessToken,
      );

      const trainers = await getStaff(auth.accessToken, {
        gymHouseId: gymHouse.id,
        staffType: 0,
      });

      const trainerIds = trainers.items.map((s) => s.id);
      expect(trainerIds).toContain(trainer.id);
      expect(trainerIds).not.toContain(reception.id);
    });

    test("gets a staff record by ID", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });

      const created = await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const fetched = await getStaffById(created.id, gymHouse.id, auth.accessToken);

      expect(fetched.id).toBe(created.id);
      expect(fetched.userId).toBe(staffAuth.userId);
    });

    test("updates staff salary", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });

      const created = await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const updated = await updateStaff(
        created.id,
        gymHouse.id,
        {
          staffType: 0,
          baseSalary: 12_000_000,
          perClassBonus: 200_000,
        },
        auth.accessToken,
      );

      expect(updated.baseSalary).toBe(12_000_000);
      expect(updated.perClassBonus).toBe(200_000);
    });
  });

  test.describe("Shift Assignments", () => {
    test("creates a shift assignment for a staff member", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      const staff = await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const shift = await createShiftAssignment(
        generateShiftAssignment({
          staffId: staff.id,
          gymHouseId: gymHouse.id,
          shiftDate: offsetDate(1),
        }),
        auth.accessToken,
      );

      expect(shift.id).toBeTruthy();
      expect(shift.staffId).toBe(staff.id);
      expect(shift.gymHouseId).toBe(gymHouse.id);
    });

    test("lists shift assignments filtered by date range", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      const staff = await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      // Create shift in the "near future" range and one outside
      const insideDate = offsetDate(2);
      const outsideDate = offsetDate(30);

      const shiftInside = await createShiftAssignment(
        generateShiftAssignment({
          staffId: staff.id,
          gymHouseId: gymHouse.id,
          shiftDate: insideDate,
        }),
        auth.accessToken,
      );
      await createShiftAssignment(
        generateShiftAssignment({
          staffId: staff.id,
          gymHouseId: gymHouse.id,
          shiftDate: outsideDate,
        }),
        auth.accessToken,
      );

      const results = await getShiftAssignments(auth.accessToken, {
        gymHouseId: gymHouse.id,
        from: offsetDate(1),
        to: offsetDate(7),
      });

      const ids = results.map((s) => s.id);
      expect(ids).toContain(shiftInside.id);
    });

    test("lists shift assignments filtered by staffId", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const userA = generateUser();
      const authA = await register({
        email: userA.email,
        password: userA.password,
        fullName: userA.fullName,
        phone: null,
      });
      const userB = generateUser();
      const authB = await register({
        email: userB.email,
        password: userB.password,
        fullName: userB.fullName,
        phone: null,
      });

      const staffA = await createStaff(
        generateStaff({ userId: authA.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );
      const staffB = await createStaff(
        generateStaff({ userId: authB.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const shiftA = await createShiftAssignment(
        generateShiftAssignment({
          staffId: staffA.id,
          gymHouseId: gymHouse.id,
          shiftDate: offsetDate(1),
        }),
        auth.accessToken,
      );
      await createShiftAssignment(
        generateShiftAssignment({
          staffId: staffB.id,
          gymHouseId: gymHouse.id,
          shiftDate: offsetDate(2),
        }),
        auth.accessToken,
      );

      const results = await getShiftAssignments(auth.accessToken, {
        gymHouseId: gymHouse.id,
        staffId: staffA.id,
      });

      const ids = results.map((s) => s.id);
      expect(ids).toContain(shiftA.id);
      for (const item of results) {
        expect(item.staffId).toBe(staffA.id);
      }
    });

    test("updates a shift assignment", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      const staff = await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const shift = await createShiftAssignment(
        generateShiftAssignment({
          staffId: staff.id,
          gymHouseId: gymHouse.id,
          shiftDate: offsetDate(3),
          shiftType: 0, // Morning
        }),
        auth.accessToken,
      );

      const updated = await updateShiftAssignment(
        shift.id,
        gymHouse.id,
        {
          shiftDate: offsetDate(3),
          startTime: "14:00:00",
          endTime: "22:00:00",
          shiftType: 2, // Evening
          status: 1,   // Completed
        },
        auth.accessToken,
      );

      expect(updated.shiftType).toMatch(/evening/i);
      expect(updated.status).toMatch(/completed/i);
    });
  });

  test.describe("Payroll", () => {
    test("creates a payroll period and returns entries", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const period = await createPayrollPeriod(
        generatePayrollPeriod({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      expect(period.id).toBeTruthy();
      expect(period.gymHouseId).toBe(gymHouse.id);
      expect(Array.isArray(period.entries)).toBe(true);
    });

    test("lists payroll periods for a gym house", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const created = await createPayrollPeriod(
        generatePayrollPeriod({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const list = await getPayrollPeriods(gymHouse.id, auth.accessToken);

      expect(list.totalCount).toBeGreaterThanOrEqual(1);
      const ids = list.items.map((p) => p.id);
      expect(ids).toContain(created.id);
    });

    test("gets payroll period detail with entries", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const created = await createPayrollPeriod(
        generatePayrollPeriod({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const detail = await getPayrollPeriodById(created.id, gymHouse.id, auth.accessToken);

      expect(detail.id).toBe(created.id);
      expect(Array.isArray(detail.entries)).toBe(true);
    });

    test("approves a payroll period and status becomes Approved", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const period = await createPayrollPeriod(
        generatePayrollPeriod({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const approved = await approvePayroll(period.id, gymHouse.id, auth.accessToken);

      expect(approved.status).toMatch(/approved/i);
      expect(approved.approvedById).toBeTruthy();
    });

    test("cannot re-approve an already-approved payroll period (409)", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const staffUser = generateUser();
      const staffAuth = await register({
        email: staffUser.email,
        password: staffUser.password,
        fullName: staffUser.fullName,
        phone: null,
      });
      await createStaff(
        generateStaff({ userId: staffAuth.userId, gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      const period = await createPayrollPeriod(
        generatePayrollPeriod({ gymHouseId: gymHouse.id }),
        auth.accessToken,
      );

      await approvePayroll(period.id, gymHouse.id, auth.accessToken);

      const res = await apiRequestRaw(
        "PATCH",
        `/payroll-periods/${period.id}/approve?gymHouseId=${gymHouse.id}`,
        undefined,
        auth.accessToken,
      );

      expect(res.status).toBe(409);
    });
  });
});
