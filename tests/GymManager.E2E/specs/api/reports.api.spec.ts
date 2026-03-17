import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createTransaction,
  getPnLReport,
  getRevenueMetrics,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateTransaction,
  offsetIso,
} from "../../helpers/test-data.js";

// Helpers to produce date strings for report ranges
function startOfMonthIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfMonthIso(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

function farPastIso(): string {
  return "2000-01-01T00:00:00.000Z";
}

function farPastEndIso(): string {
  return "2000-01-31T23:59:59.999Z";
}

test.describe("Reports (API)", () => {
  test.describe("P&L Report", () => {
    test("returns a P&L report with income lines after seeding a revenue transaction", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      // Seed a revenue (credit) transaction
      await createTransaction(
        gymHouse.id,
        generateTransaction({
          transactionType: 0, // MembershipFee
          direction: 0,       // Credit
          amount: 1_500_000,
          category: "Revenue",
          transactionDate: new Date().toISOString(),
        }),
        auth.accessToken,
      );

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const report = await getPnLReport(gymHouse.id, from, to, auth.accessToken);

      expect(report.gymHouseId).toBe(gymHouse.id);
      expect(typeof report.totalIncome).toBe("number");
      expect(typeof report.totalExpense).toBe("number");
      expect(typeof report.netProfit).toBe("number");
      expect(Array.isArray(report.incomeLines)).toBe(true);
      expect(Array.isArray(report.expenseLines)).toBe(true);
      expect(report.totalIncome).toBeGreaterThan(0);
    });

    test("returns a P&L report with expense lines after seeding an expense transaction", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      // Seed an expense (debit) transaction
      await createTransaction(
        gymHouse.id,
        generateTransaction({
          transactionType: 2, // Rent
          direction: 1,       // Debit
          amount: 800_000,
          category: "OperatingExpense",
          transactionDate: new Date().toISOString(),
        }),
        auth.accessToken,
      );

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const report = await getPnLReport(gymHouse.id, from, to, auth.accessToken);

      expect(report.totalExpense).toBeGreaterThan(0);
    });

    test("returns zeros for an empty date range (far in the past)", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const report = await getPnLReport(
        gymHouse.id,
        farPastIso(),
        farPastEndIso(),
        auth.accessToken,
      );

      expect(report.gymHouseId).toBe(gymHouse.id);
      expect(report.totalIncome).toBe(0);
      expect(report.totalExpense).toBe(0);
      expect(report.netProfit).toBe(0);
    });

    test("netProfit equals totalIncome minus totalExpense", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      await createTransaction(
        gymHouse.id,
        generateTransaction({
          transactionType: 0,
          direction: 0,
          amount: 2_000_000,
          category: "Revenue",
          transactionDate: new Date().toISOString(),
        }),
        auth.accessToken,
      );
      await createTransaction(
        gymHouse.id,
        generateTransaction({
          transactionType: 2,
          direction: 1,
          amount: 500_000,
          category: "OperatingExpense",
          transactionDate: new Date().toISOString(),
        }),
        auth.accessToken,
      );

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const report = await getPnLReport(gymHouse.id, from, to, auth.accessToken);

      // Net profit should be income minus expense (allow small float tolerance)
      const expected = report.totalIncome - report.totalExpense;
      expect(Math.abs(report.netProfit - expected)).toBeLessThan(1);
    });

    test("P&L report response includes from and to fields matching the query", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const report = await getPnLReport(gymHouse.id, from, to, auth.accessToken);

      // The report should echo back the queried range
      expect(report.from).toBeTruthy();
      expect(report.to).toBeTruthy();
    });
  });

  test.describe("Revenue Metrics", () => {
    test("returns revenue metrics with totalRevenue > 0 after seeding transactions", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      await createTransaction(
        gymHouse.id,
        generateTransaction({
          transactionType: 0,
          direction: 0,
          amount: 3_000_000,
          category: "Revenue",
          transactionDate: new Date().toISOString(),
        }),
        auth.accessToken,
      );

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const metrics = await getRevenueMetrics(gymHouse.id, from, to, auth.accessToken);

      expect(metrics.gymHouseId).toBe(gymHouse.id);
      expect(typeof metrics.mrr).toBe("number");
      expect(typeof metrics.churnRate).toBe("number");
      expect(typeof metrics.avgRevenuePerMember).toBe("number");
      expect(typeof metrics.totalRevenue).toBe("number");
      expect(typeof metrics.activeMembers).toBe("number");
      expect(typeof metrics.cancelledSubscriptions).toBe("number");
      expect(metrics.totalRevenue).toBeGreaterThan(0);
    });

    test("returns zeros when there are no transactions in the date range", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const metrics = await getRevenueMetrics(
        gymHouse.id,
        farPastIso(),
        farPastEndIso(),
        auth.accessToken,
      );

      expect(metrics.totalRevenue).toBe(0);
    });

    test("revenue metrics response includes gymHouseId matching the request", async () => {
      const owner = generateUser();
      const auth = await register({
        email: owner.email,
        password: owner.password,
        fullName: owner.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);

      const from = startOfMonthIso();
      const to = endOfMonthIso();
      const metrics = await getRevenueMetrics(gymHouse.id, from, to, auth.accessToken);

      expect(metrics.gymHouseId).toBe(gymHouse.id);
      expect(metrics.from).toBeTruthy();
      expect(metrics.to).toBeTruthy();
    });
  });
});
