import { test as base, expect, Page } from "@playwright/test";
import {
  register,
  createGymHouse,
  AuthResponse,
  GymHouseDto,
} from "../helpers/api-client.js";
import { generateUser, generateGymHouse } from "../helpers/test-data.js";

export interface GymHouseFixtures {
  authResponse: AuthResponse;
  authToken: string;
  gymHouse: GymHouseDto;
}

export const test = base.extend<GymHouseFixtures>({
  authResponse: async ({}, use) => {
    const userData = generateUser();
    const auth = await register({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone ?? null,
    });
    await use(auth);
  },

  authToken: async ({ authResponse }, use) => {
    await use(authResponse.accessToken);
  },

  gymHouse: async ({ authResponse }, use) => {
    const gh = await createGymHouse(
      generateGymHouse(),
      authResponse.accessToken,
    );
    await use(gh);
  },
});

export { expect };
