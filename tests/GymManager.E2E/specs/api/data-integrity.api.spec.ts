import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createTransaction,
  getTransactions,
  reverseTransaction,
  deleteGymHouse,
  getGymHouses,
  getMembers,
  apiRequestRaw,
  AuthResponse,
  GymHouseDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateTransaction,
} from "../../helpers/test-data.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IntegrityContext {
  auth: AuthResponse;
  gymHouse: GymHouseDto;
}

async function setupContext(): Promise<IntegrityContext> {
  const user = generateUser();
  const auth = await register({
    email: user.email,
    password: user.password,
    fullName: user.fullName,
    phone: null,
  });
  const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
  return { auth, gymHouse };
}

// ---------------------------------------------------------------------------
// Transaction reversal
// ---------------------------------------------------------------------------

test.describe("Transaction reversal (API)", () => {
  test("reversing a transaction creates a counter-entry", async () => {
    const { auth, gymHouse } = await setupContext();

    const original = await createTransaction(
      gymHouse.id,
      generateTransaction({ transactionType: 0, direction: 0, amount: 1_000_000 }),
      auth.accessToken,
    );

    const reversal = await reverseTransaction(
      gymHouse.id,
      original.id,
      "Customer request",
      auth.accessToken,
    );

    expect(reversal.id).toBeTruthy();
    expect(reversal.id).not.toBe(original.id);
    // The reversal is a counter-entry — same amount, opposite direction
    expect(reversal.amount).toBe(original.amount);
    expect(reversal.reversesTransactionId).toBe(original.id);
  });

  test("original transaction gets reversedByTransactionId after reversal", async () => {
    const { auth, gymHouse } = await setupContext();

    const original = await createTransaction(
      gymHouse.id,
      generateTransaction({ transactionType: 0, direction: 0, amount: 500_000 }),
      auth.accessToken,
    );

    const reversal = await reverseTransaction(
      gymHouse.id,
      original.id,
      "Duplicate charge",
      auth.accessToken,
    );

    // Re-fetch the original via the transactions list to confirm the field is set
    const list = await getTransactions(gymHouse.id, auth.accessToken);
    const updated = list.items.find((t) => t.id === original.id);
    expect(updated).toBeDefined();
    expect(updated!.reversedByTransactionId).toBe(reversal.id);
  });

  test("returns 409 when reversing an already-reversed transaction", async () => {
    const { auth, gymHouse } = await setupContext();

    const original = await createTransaction(
      gymHouse.id,
      generateTransaction({ transactionType: 0, direction: 0, amount: 750_000 }),
      auth.accessToken,
    );

    await reverseTransaction(gymHouse.id, original.id, "First reversal", auth.accessToken);

    const res = await apiRequestRaw(
      "POST",
      `/gymhouses/${gymHouse.id}/transactions/${original.id}/reverse`,
      { reason: "Second reversal attempt" },
      auth.accessToken,
    );
    expect(res.status).toBe(409);
  });

  test("returns 404 when reversing a non-existent transaction", async () => {
    const { auth, gymHouse } = await setupContext();

    const res = await apiRequestRaw(
      "POST",
      `/gymhouses/${gymHouse.id}/transactions/00000000-0000-0000-0000-000000000000/reverse`,
      { reason: "Does not exist" },
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

test.describe("Soft delete (API)", () => {
  test("deleted gym house is gone from list but was there before deletion", async () => {
    const { auth } = await setupContext();
    const gh = await createGymHouse(generateGymHouse(), auth.accessToken);

    const beforeDelete = await getGymHouses(auth.accessToken);
    expect(beforeDelete.some((g) => g.id === gh.id)).toBe(true);

    await deleteGymHouse(gh.id, auth.accessToken);

    const afterDelete = await getGymHouses(auth.accessToken);
    expect(afterDelete.some((g) => g.id === gh.id)).toBe(false);
  });

  test("deleted gym house returns 404 on direct lookup", async () => {
    const { auth, gymHouse } = await setupContext();

    await deleteGymHouse(gymHouse.id, auth.accessToken);

    const res = await apiRequestRaw(
      "GET",
      `/gym-houses/${gymHouse.id}`,
      undefined,
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });

  test("deleting the same gym house twice returns 404 on the second attempt", async () => {
    const { auth, gymHouse } = await setupContext();

    await deleteGymHouse(gymHouse.id, auth.accessToken);

    const res = await apiRequestRaw(
      "DELETE",
      `/gym-houses/${gymHouse.id}`,
      undefined,
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

test.describe("Pagination (API)", () => {
  test("respects pageSize and returns correct page count", async () => {
    const { auth, gymHouse } = await setupContext();

    // Create 5 members so we have enough data to paginate
    for (let i = 0; i < 5; i++) {
      await createMember(gymHouse.id, generateMember(), auth.accessToken);
    }

    const page1 = await getMembers(gymHouse.id, auth.accessToken, {
      page: 1,
      pageSize: 2,
    });

    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
    expect(page1.items.length).toBeLessThanOrEqual(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(5);
  });

  test("second page returns different items than first page", async () => {
    const { auth, gymHouse } = await setupContext();

    for (let i = 0; i < 4; i++) {
      await createMember(gymHouse.id, generateMember(), auth.accessToken);
    }

    const page1 = await getMembers(gymHouse.id, auth.accessToken, {
      page: 1,
      pageSize: 2,
    });
    const page2 = await getMembers(gymHouse.id, auth.accessToken, {
      page: 2,
      pageSize: 2,
    });

    const ids1 = new Set(page1.items.map((m) => m.id));
    const ids2 = new Set(page2.items.map((m) => m.id));

    // No ID should appear on both pages
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false);
    }
  });

  test("page beyond total returns empty items array", async () => {
    const { auth, gymHouse } = await setupContext();

    await createMember(gymHouse.id, generateMember(), auth.accessToken);

    const page999 = await getMembers(gymHouse.id, auth.accessToken, {
      page: 999,
      pageSize: 20,
    });

    expect(page999.items).toHaveLength(0);
  });

  test("totalCount reflects the true number of members across pages", async () => {
    const { auth, gymHouse } = await setupContext();

    const memberCount = 3;
    for (let i = 0; i < memberCount; i++) {
      await createMember(gymHouse.id, generateMember(), auth.accessToken);
    }

    const result = await getMembers(gymHouse.id, auth.accessToken, {
      page: 1,
      pageSize: 1,
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(memberCount);
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

test.describe("Member search (API)", () => {
  test("search by name returns matching members", async () => {
    const { auth, gymHouse } = await setupContext();

    const uniqueName = `SearchTarget_${Date.now().toString(36)}`;
    await createMember(
      gymHouse.id,
      generateMember({ fullName: uniqueName }),
      auth.accessToken,
    );
    // Create a second member that should not match
    await createMember(gymHouse.id, generateMember(), auth.accessToken);

    const result = await getMembers(gymHouse.id, auth.accessToken, {
      search: uniqueName,
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    for (const m of result.items) {
      expect(m.fullName.toLowerCase()).toContain(uniqueName.toLowerCase());
    }
  });

  test("search with no match returns empty items", async () => {
    const { auth, gymHouse } = await setupContext();

    // Add a regular member to ensure the gym is not empty
    await createMember(gymHouse.id, generateMember(), auth.accessToken);

    const result = await getMembers(gymHouse.id, auth.accessToken, {
      search: "ZZZZ_NO_MATCH_EVER_ZZZZ",
    });

    expect(result.items).toHaveLength(0);
  });

  test("search is case-insensitive", async () => {
    const { auth, gymHouse } = await setupContext();

    const suffix = Date.now().toString(36);
    const name = `Searchable_${suffix}`;
    await createMember(gymHouse.id, generateMember({ fullName: name }), auth.accessToken);

    const upper = await getMembers(gymHouse.id, auth.accessToken, {
      search: name.toUpperCase(),
    });
    const lower = await getMembers(gymHouse.id, auth.accessToken, {
      search: name.toLowerCase(),
    });

    expect(upper.items.length).toBeGreaterThanOrEqual(1);
    expect(lower.items.length).toBe(upper.items.length);
  });
});
