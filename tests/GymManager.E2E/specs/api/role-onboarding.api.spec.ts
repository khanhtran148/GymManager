import { test, expect } from "@playwright/test";
import {
  register,
  login,
  createGymHouse,
  getGymHouses,
  createMember,
  createSubscription,
  createStaff,
  getStaff,
} from "../../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateStaff,
} from "../../helpers/test-data.js";

test.describe("Role Onboarding (API)", () => {
  test.describe("Owner first-time flow", () => {
    test("owner registers, creates gym house, creates member, and creates subscription", async () => {
      // Step 1: Register
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });

      expect(ownerAuth.accessToken).toBeTruthy();
      expect(ownerAuth.userId).toBeTruthy();

      // Step 2: Create gym house
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      expect(gymHouse.id).toBeTruthy();
      expect(gymHouse.ownerId).toBe(ownerAuth.userId);

      // Step 3: Create member
      const member = await createMember(gymHouse.id, generateMember(), ownerAuth.accessToken);

      expect(member.id).toBeTruthy();
      expect(member.gymHouseId).toBe(gymHouse.id);

      // Step 4: Create subscription for the member
      const subscription = await createSubscription(
        gymHouse.id,
        member.id,
        generateSubscription(),
        ownerAuth.accessToken,
      );

      expect(subscription.id).toBeTruthy();
      expect(subscription.memberId).toBe(member.id);
      expect(subscription.status).toBe("Active");
    });
  });

  test.describe("Owner returning flow", () => {
    test("owner logs in with existing credentials and fetches gym houses", async () => {
      // Register an owner first
      const ownerData = generateUser();
      await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });

      // Login again (returning owner)
      const loginAuth = await login({
        email: ownerData.email,
        password: ownerData.password,
      });

      expect(loginAuth.accessToken).toBeTruthy();
      expect(loginAuth.email).toBe(ownerData.email);

      // Fetch gym houses
      const gymHouses = await getGymHouses(loginAuth.accessToken);

      expect(Array.isArray(gymHouses)).toBe(true);
    });

    test("returning owner sees gym houses they previously created", async () => {
      // Register, create gym house
      const ownerData = generateUser();
      const registerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });

      const gymHouseData = generateGymHouse();
      const created = await createGymHouse(gymHouseData, registerAuth.accessToken);

      // Login as the same owner
      const loginAuth = await login({
        email: ownerData.email,
        password: ownerData.password,
      });

      const gymHouses = await getGymHouses(loginAuth.accessToken);
      const ids = gymHouses.map((g) => g.id);
      expect(ids).toContain(created.id);
    });
  });

  test.describe("Trainer onboarding", () => {
    test("owner registers a trainer user, creates staff record, trainer appears in staff list", async () => {
      // Register owner
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      // Register trainer user
      const trainerData = generateUser();
      const trainerAuth = await register({
        email: trainerData.email,
        password: trainerData.password,
        fullName: trainerData.fullName,
        phone: null,
      });

      // Owner creates staff record for the trainer
      const staff = await createStaff(
        generateStaff({
          userId: trainerAuth.userId,
          gymHouseId: gymHouse.id,
          staffType: 0, // Trainer
        }),
        ownerAuth.accessToken,
      );

      expect(staff.id).toBeTruthy();
      expect(staff.userId).toBe(trainerAuth.userId);
      expect(staff.staffType).toMatch(/trainer/i);

      // Verify the trainer appears in the staff list
      const staffList = await getStaff(ownerAuth.accessToken, {
        gymHouseId: gymHouse.id,
        staffType: 0,
      });

      const staffIds = staffList.items.map((s) => s.id);
      expect(staffIds).toContain(staff.id);
    });

    test("owner can onboard multiple staff members of different types", async () => {
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      const trainerData = generateUser();
      const trainerAuth = await register({
        email: trainerData.email,
        password: trainerData.password,
        fullName: trainerData.fullName,
        phone: null,
      });
      const receptionData = generateUser();
      const receptionAuth = await register({
        email: receptionData.email,
        password: receptionData.password,
        fullName: receptionData.fullName,
        phone: null,
      });

      const trainer = await createStaff(
        generateStaff({ userId: trainerAuth.userId, gymHouseId: gymHouse.id, staffType: 0 }),
        ownerAuth.accessToken,
      );
      const reception = await createStaff(
        generateStaff({ userId: receptionAuth.userId, gymHouseId: gymHouse.id, staffType: 3 }),
        ownerAuth.accessToken,
      );

      const allStaff = await getStaff(ownerAuth.accessToken, {
        gymHouseId: gymHouse.id,
      });

      const allIds = allStaff.items.map((s) => s.id);
      expect(allIds).toContain(trainer.id);
      expect(allIds).toContain(reception.id);
    });
  });

  test.describe("Member onboarding", () => {
    test("owner creates member, creates subscription, member status is Active", async () => {
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      // Create member
      const member = await createMember(gymHouse.id, generateMember(), ownerAuth.accessToken);

      expect(member.id).toBeTruthy();

      // Create subscription
      const subscription = await createSubscription(
        gymHouse.id,
        member.id,
        generateSubscription({ type: 0, price: 500_000 }),
        ownerAuth.accessToken,
      );

      expect(subscription.id).toBeTruthy();
      expect(subscription.status).toBe("Active");
    });

    test("owner can onboard multiple members with independent subscriptions", async () => {
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      const memberA = await createMember(gymHouse.id, generateMember(), ownerAuth.accessToken);
      const memberB = await createMember(gymHouse.id, generateMember(), ownerAuth.accessToken);

      const subA = await createSubscription(
        gymHouse.id,
        memberA.id,
        generateSubscription({ type: 0 }),
        ownerAuth.accessToken,
      );
      const subB = await createSubscription(
        gymHouse.id,
        memberB.id,
        generateSubscription({ type: 2 }), // Annual
        ownerAuth.accessToken,
      );

      expect(subA.memberId).toBe(memberA.id);
      expect(subB.memberId).toBe(memberB.id);
      expect(subA.status).toBe("Active");
      expect(subB.status).toBe("Active");
    });

    test("member email and fullName are persisted and returned in the member DTO", async () => {
      const ownerData = generateUser();
      const ownerAuth = await register({
        email: ownerData.email,
        password: ownerData.password,
        fullName: ownerData.fullName,
        phone: null,
      });
      const gymHouse = await createGymHouse(generateGymHouse(), ownerAuth.accessToken);

      const memberPayload = generateMember();
      const member = await createMember(gymHouse.id, memberPayload, ownerAuth.accessToken);

      expect(member.email).toBe(memberPayload.email);
      expect(member.fullName).toBe(memberPayload.fullName);
    });
  });
});
