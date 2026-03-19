import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createSubscription,
  getSubscriptionsByMember,
  freezeSubscription,
  cancelSubscription,
  renewSubscription,
  createTransaction,
  getTransactions,
  apiRequestRaw,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  SubscriptionDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateTransaction,
  offsetIso,
} from "../../helpers/test-data.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SubTestContext {
  auth: AuthResponse;
  gymHouse: GymHouseDto;
  member: MemberDto;
}

async function setupSubContext(): Promise<SubTestContext> {
  const user = generateUser();
  const auth = await register({
    email: user.email,
    password: user.password,
    fullName: user.fullName,
    phone: null,
  });
  const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
  const member = await createMember(gymHouse.id, generateMember(), auth.accessToken);
  return { auth, gymHouse, member };
}

async function setupActiveSubscription(
  ctx: SubTestContext,
): Promise<SubscriptionDto> {
  return createSubscription(
    ctx.gymHouse.id,
    ctx.member.id,
    generateSubscription(),
    ctx.auth.accessToken,
  );
}

// ---------------------------------------------------------------------------
// Subscription lifecycle
// ---------------------------------------------------------------------------

test.describe("Subscription lifecycle (API)", () => {
  test("creates a Monthly subscription with Active status", async () => {
    const ctx = await setupSubContext();
    const sub = await createSubscription(
      ctx.gymHouse.id,
      ctx.member.id,
      generateSubscription({ type: 0 }), // Monthly
      ctx.auth.accessToken,
    );

    expect(sub.id).toBeTruthy();
    expect(sub.memberId).toBe(ctx.member.id);
    expect(sub.gymHouseId).toBe(ctx.gymHouse.id);
    expect(sub.status).toBe("Active");
    expect(sub.type).toMatch(/monthly/i);
  });

  test("creates a Quarterly subscription with Active status", async () => {
    const ctx = await setupSubContext();
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);

    const sub = await createSubscription(
      ctx.gymHouse.id,
      ctx.member.id,
      generateSubscription({
        type: 1, // Quarterly
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }),
      ctx.auth.accessToken,
    );

    expect(sub.status).toBe("Active");
    expect(sub.type).toMatch(/quarterly/i);
  });

  test("freezes an Active subscription and status becomes Frozen", async () => {
    const ctx = await setupSubContext();
    const sub = await setupActiveSubscription(ctx);

    const frozenUntil = offsetIso(14);
    const frozen = await freezeSubscription(
      sub.id,
      { gymHouseId: ctx.gymHouse.id, frozenUntil },
      ctx.auth.accessToken,
    );

    expect(frozen.status).toBe("Frozen");
    expect(frozen.frozenAt).not.toBeNull();
    expect(frozen.frozenUntil).not.toBeNull();
  });

  test("cancels an Active subscription and status becomes Cancelled", async () => {
    const ctx = await setupSubContext();
    const sub = await setupActiveSubscription(ctx);

    const cancelled = await cancelSubscription(
      sub.id,
      { gymHouseId: ctx.gymHouse.id },
      ctx.auth.accessToken,
    );

    expect(cancelled.status).toBe("Cancelled");
  });

  test("renews a Cancelled subscription and status becomes Active", async () => {
    const ctx = await setupSubContext();
    const sub = await setupActiveSubscription(ctx);

    // Cancel first
    await cancelSubscription(
      sub.id,
      { gymHouseId: ctx.gymHouse.id },
      ctx.auth.accessToken,
    );

    // Renew with new dates
    const newStart = new Date();
    newStart.setMonth(newStart.getMonth() + 2);
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);

    const renewed = await renewSubscription(
      sub.id,
      {
        gymHouseId: ctx.gymHouse.id,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
        price: 600_000,
      },
      ctx.auth.accessToken,
    );

    expect(renewed.status).toBe("Active");
    expect(renewed.price).toBe(600_000);
  });
});

// ---------------------------------------------------------------------------
// Invalid transitions
// ---------------------------------------------------------------------------

test.describe("Invalid subscription transitions (API)", () => {
  test("returns 409 when freezing a Cancelled subscription", async () => {
    const ctx = await setupSubContext();
    const sub = await setupActiveSubscription(ctx);

    // Cancel first
    await cancelSubscription(
      sub.id,
      { gymHouseId: ctx.gymHouse.id },
      ctx.auth.accessToken,
    );

    // Try to freeze a Cancelled subscription
    const res = await apiRequestRaw(
      "POST",
      `/subscriptions/${sub.id}/freeze`,
      { gymHouseId: ctx.gymHouse.id, frozenUntil: offsetIso(14) },
      ctx.auth.accessToken,
    );
    expect(res.status).toBe(409);
  });

  test("returns 409 when cancelling an already Cancelled subscription", async () => {
    const ctx = await setupSubContext();
    const sub = await setupActiveSubscription(ctx);

    await cancelSubscription(
      sub.id,
      { gymHouseId: ctx.gymHouse.id },
      ctx.auth.accessToken,
    );

    const res = await apiRequestRaw(
      "POST",
      `/subscriptions/${sub.id}/cancel`,
      { gymHouseId: ctx.gymHouse.id },
      ctx.auth.accessToken,
    );
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Subscription retrieval
// ---------------------------------------------------------------------------

test.describe("Subscription retrieval (API)", () => {
  test("lists subscriptions by member", async () => {
    const ctx = await setupSubContext();

    // Create two subscriptions for the same member
    const sub1 = await setupActiveSubscription(ctx);
    await cancelSubscription(sub1.id, { gymHouseId: ctx.gymHouse.id }, ctx.auth.accessToken);

    const ctx2 = await setupSubContext();
    // Use a different member on the same gym house — reuse gymHouse
    const secondMember = await createMember(
      ctx.gymHouse.id,
      generateMember(),
      ctx.auth.accessToken,
    );
    await createSubscription(
      ctx.gymHouse.id,
      secondMember.id,
      generateSubscription(),
      ctx.auth.accessToken,
    );

    const subs = await getSubscriptionsByMember(
      ctx.gymHouse.id,
      ctx.member.id,
      ctx.auth.accessToken,
    );

    expect(subs.length).toBeGreaterThanOrEqual(1);
    for (const s of subs) {
      expect(s.memberId).toBe(ctx.member.id);
    }
  });

  test("returns an empty list for a member with no subscriptions", async () => {
    const ctx = await setupSubContext();
    // New member, no subscriptions created
    const freshMember = await createMember(
      ctx.gymHouse.id,
      generateMember(),
      ctx.auth.accessToken,
    );

    const subs = await getSubscriptionsByMember(
      ctx.gymHouse.id,
      freshMember.id,
      ctx.auth.accessToken,
    );

    expect(subs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Transaction recording
// ---------------------------------------------------------------------------

test.describe("Transaction recording (API)", () => {
  test("records a MembershipFee credit transaction", async () => {
    const ctx = await setupSubContext();
    const payload = generateTransaction({
      transactionType: 0, // MembershipFee
      direction: 0,       // Credit
      category: "Revenue",
    });
    const tx = await createTransaction(ctx.gymHouse.id, payload, ctx.auth.accessToken);

    expect(tx.id).toBeTruthy();
    expect(tx.gymHouseId).toBe(ctx.gymHouse.id);
    expect(tx.transactionType).toMatch(/membershipfee/i);
    expect(tx.direction).toMatch(/credit/i);
    expect(tx.amount).toBe(payload.amount);
  });

  test("records a Refund debit transaction", async () => {
    const ctx = await setupSubContext();
    const payload = generateTransaction({
      transactionType: 7, // Refund
      direction: 1,       // Debit
      amount: 200_000,
      category: "Refund",
      description: "Refund for cancelled membership",
    });
    const tx = await createTransaction(ctx.gymHouse.id, payload, ctx.auth.accessToken);

    expect(tx.transactionType).toMatch(/refund/i);
    expect(tx.direction).toMatch(/debit/i);
    expect(tx.amount).toBe(200_000);
  });

  test("filters transactions by type", async () => {
    const ctx = await setupSubContext();

    await createTransaction(
      ctx.gymHouse.id,
      generateTransaction({ transactionType: 0, direction: 0, category: "Revenue" }),
      ctx.auth.accessToken,
    );
    await createTransaction(
      ctx.gymHouse.id,
      generateTransaction({ transactionType: 1, direction: 1, category: "Payroll" }),
      ctx.auth.accessToken,
    );

    const result = await getTransactions(ctx.gymHouse.id, ctx.auth.accessToken, { type: 0 });
    for (const tx of result.items) {
      expect(tx.transactionType).toMatch(/membershipfee/i);
    }
  });

  test("filters transactions by direction", async () => {
    const ctx = await setupSubContext();

    await createTransaction(
      ctx.gymHouse.id,
      generateTransaction({ transactionType: 0, direction: 0, category: "Revenue" }),
      ctx.auth.accessToken,
    );
    await createTransaction(
      ctx.gymHouse.id,
      generateTransaction({ transactionType: 7, direction: 1, category: "Refund" }),
      ctx.auth.accessToken,
    );

    const credits = await getTransactions(ctx.gymHouse.id, ctx.auth.accessToken, { direction: 0 });
    for (const tx of credits.items) {
      expect(tx.direction).toMatch(/credit/i);
    }
  });

  test("filters transactions by date range", async () => {
    const ctx = await setupSubContext();

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await createTransaction(
      ctx.gymHouse.id,
      generateTransaction({ transactionDate: now.toISOString() }),
      ctx.auth.accessToken,
    );

    const result = await getTransactions(ctx.gymHouse.id, ctx.auth.accessToken, {
      from: yesterday.toISOString(),
      to: nextMonth.toISOString(),
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    for (const tx of result.items) {
      const txDate = new Date(tx.transactionDate);
      expect(txDate >= yesterday).toBe(true);
      expect(txDate <= nextMonth).toBe(true);
    }
  });
});
