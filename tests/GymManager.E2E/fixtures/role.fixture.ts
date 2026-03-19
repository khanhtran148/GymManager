import { test as base, expect } from "@playwright/test";
import {
  register,
  createGymHouse,
  createMember,
  createSubscription,
  createStaff,
  AuthResponse,
  GymHouseDto,
  MemberDto,
  SubscriptionDto,
  StaffDto,
} from "../helpers/api-client.js";
import {
  generateUser,
  generateGymHouse,
  generateMember,
  generateSubscription,
  generateStaff,
} from "../helpers/test-data.js";

export interface RoleFixtures {
  owner: {
    auth: AuthResponse;
    token: string;
    gymHouse: GymHouseDto;
  };
  trainer: {
    auth: AuthResponse;
    token: string;
    staff: StaffDto;
  };
  member: {
    dto: MemberDto;
    subscription: SubscriptionDto;
  };
}

export const test = base.extend<RoleFixtures>({
  owner: async ({}, use) => {
    const userData = generateUser();
    const auth = await register({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone ?? null,
    });
    const gymHouse = await createGymHouse(generateGymHouse(), auth.accessToken);
    await use({ auth, token: auth.accessToken, gymHouse });
  },

  trainer: async ({ owner }, use) => {
    const trainerUser = generateUser();
    const trainerAuth = await register({
      email: trainerUser.email,
      password: trainerUser.password,
      fullName: trainerUser.fullName,
      phone: trainerUser.phone ?? null,
    });
    const staff = await createStaff(
      generateStaff({
        userId: trainerAuth.userId,
        gymHouseId: owner.gymHouse.id,
        staffType: 0, // Trainer
      }),
      owner.token,
    );
    await use({ auth: trainerAuth, token: trainerAuth.accessToken, staff });
  },

  member: async ({ owner }, use) => {
    const memberData = generateMember();
    const dto = await createMember(owner.gymHouse.id, memberData, owner.token);
    const subscription = await createSubscription(
      owner.gymHouse.id,
      dto.id,
      generateSubscription(),
      owner.token,
    );
    await use({ dto, subscription });
  },
});

export { expect };
