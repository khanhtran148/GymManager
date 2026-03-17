import { test, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  getGymHouses,
  getGymHouseById,
  updateGymHouse,
  deleteGymHouse,
  createMember,
  getMembers,
  createBooking,
  getBookings,
  createTimeSlot,
  apiRequestRaw,
  AuthResponse,
  GymHouseDto,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateUpdateGymHouse,
  generateTimeSlot,
  generateBooking,
} from "../../helpers/test-data.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupOwner(): Promise<AuthResponse> {
  const user = generateUser();
  return register({
    email: user.email,
    password: user.password,
    fullName: user.fullName,
    phone: null,
  });
}

async function setupOwnerWithGym(): Promise<{
  auth: AuthResponse;
  gymHouse: GymHouseDto;
}> {
  const auth = await setupOwner();
  const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
  return { auth, gymHouse };
}

// ---------------------------------------------------------------------------
// Gym House CRUD
// ---------------------------------------------------------------------------

test.describe("Gym House CRUD (API)", () => {
  test("creates a gym house and returns full DTO", async () => {
    const auth = await setupOwner();
    const payload = generateGymHouse();
    const gh = await createGymHouse(payload, auth.accessToken);

    expect(gh.id).toBeTruthy();
    expect(gh.name).toBe(payload.name);
    expect(gh.address).toBe(payload.address);
    expect(gh.hourlyCapacity).toBe(payload.hourlyCapacity);
    expect(gh.ownerId).toBe(auth.userId);
  });

  test("lists gym houses for the authenticated owner", async () => {
    const auth = await setupOwner();
    await createGymHouse(generateGymHouse(), auth.accessToken);
    await createGymHouse(generateGymHouse(), auth.accessToken);

    const list = await getGymHouses(auth.accessToken);
    expect(list.length).toBeGreaterThanOrEqual(2);
    for (const gh of list) {
      expect(gh.ownerId).toBe(auth.userId);
    }
  });

  test("gets a gym house by ID", async () => {
    const { auth, gymHouse } = await setupOwnerWithGym();
    const fetched = await getGymHouseById(gymHouse.id, auth.accessToken);

    expect(fetched.id).toBe(gymHouse.id);
    expect(fetched.name).toBe(gymHouse.name);
  });

  test("returns 404 when gym house ID does not exist", async () => {
    const auth = await setupOwner();
    const res = await apiRequestRaw(
      "GET",
      "/gym-houses/00000000-0000-0000-0000-000000000000",
      undefined,
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });

  test("updates a gym house and returns updated DTO", async () => {
    const { auth, gymHouse } = await setupOwnerWithGym();
    const update = generateUpdateGymHouse();
    const updated = await updateGymHouse(gymHouse.id, update, auth.accessToken);

    expect(updated.id).toBe(gymHouse.id);
    expect(updated.name).toBe(update.name);
    expect(updated.address).toBe(update.address);
    expect(updated.hourlyCapacity).toBe(update.hourlyCapacity);
  });

  test("soft-deletes a gym house so it disappears from the list", async () => {
    const auth = await setupOwner();
    const gh = await createGymHouse(generateGymHouse(), auth.accessToken);

    await deleteGymHouse(gh.id, auth.accessToken);

    const list = await getGymHouses(auth.accessToken);
    const found = list.find((g) => g.id === gh.id);
    expect(found).toBeUndefined();
  });

  test("returns 404 when getting a deleted gym house by ID", async () => {
    const { auth, gymHouse } = await setupOwnerWithGym();
    await deleteGymHouse(gymHouse.id, auth.accessToken);

    const res = await apiRequestRaw(
      "GET",
      `/gym-houses/${gymHouse.id}`,
      undefined,
      auth.accessToken,
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Cross-gym isolation
// ---------------------------------------------------------------------------

test.describe("Cross-gym isolation (API)", () => {
  test("owner A cannot read owner B's gym house by ID", async () => {
    const { gymHouse: gymB } = await setupOwnerWithGym();
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "GET",
      `/gym-houses/${gymB.id}`,
      undefined,
      authA.accessToken,
    );
    // 403 Forbidden or 404 Not Found — both are acceptable isolation responses
    expect([403, 404]).toContain(res.status);
  });

  test("owner A's gym list does not contain owner B's gym house", async () => {
    const { gymHouse: gymB } = await setupOwnerWithGym();
    const authA = await setupOwner();
    await createGymHouse(generateGymHouse(), authA.accessToken);

    const listA = await getGymHouses(authA.accessToken);
    const found = listA.find((g) => g.id === gymB.id);
    expect(found).toBeUndefined();
  });

  test("owner A cannot update owner B's gym house", async () => {
    const { gymHouse: gymB } = await setupOwnerWithGym();
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "PUT",
      `/gym-houses/${gymB.id}`,
      generateUpdateGymHouse(),
      authA.accessToken,
    );
    expect([403, 404]).toContain(res.status);
  });

  test("owner A cannot delete owner B's gym house", async () => {
    const { gymHouse: gymB } = await setupOwnerWithGym();
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "DELETE",
      `/gym-houses/${gymB.id}`,
      undefined,
      authA.accessToken,
    );
    expect([403, 404]).toContain(res.status);
  });

  test("owner A cannot list members in owner B's gym house", async () => {
    const { auth: authB, gymHouse: gymB } = await setupOwnerWithGym();
    await createMember(gymB.id, generateMember(), authB.accessToken);
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "GET",
      `/gymhouses/${gymB.id}/members`,
      undefined,
      authA.accessToken,
    );
    expect([403, 404]).toContain(res.status);
  });

  test("owner A cannot create a member in owner B's gym house", async () => {
    const { gymHouse: gymB } = await setupOwnerWithGym();
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "POST",
      `/gymhouses/${gymB.id}/members`,
      generateMember(),
      authA.accessToken,
    );
    expect([403, 404]).toContain(res.status);
  });

  test("owner A cannot list bookings in owner B's gym house", async () => {
    const { auth: authB, gymHouse: gymB } = await setupOwnerWithGym();
    // Create a member and a time slot so the gym is populated
    await createMember(gymB.id, generateMember(), authB.accessToken);
    const authA = await setupOwner();

    const res = await apiRequestRaw(
      "GET",
      `/gymhouses/${gymB.id}/bookings`,
      undefined,
      authA.accessToken,
    );
    expect([403, 404]).toContain(res.status);
  });
});

// ---------------------------------------------------------------------------
// Empty system
// ---------------------------------------------------------------------------

test.describe("Empty system (API)", () => {
  test("fresh user gets an empty gym house list", async () => {
    const auth = await setupOwner();
    const list = await getGymHouses(auth.accessToken);
    expect(list).toHaveLength(0);
  });

  test("fresh gym house has no members", async () => {
    const { auth, gymHouse } = await setupOwnerWithGym();
    const result = await getMembers(gymHouse.id, auth.accessToken);
    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  test("fresh gym house has no bookings", async () => {
    const { auth, gymHouse } = await setupOwnerWithGym();
    const result = await getBookings(gymHouse.id, auth.accessToken);
    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
