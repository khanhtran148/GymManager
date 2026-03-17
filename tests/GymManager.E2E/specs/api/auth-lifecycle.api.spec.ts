import { test, expect } from "@playwright/test";
import {
  register,
  login,
  refreshToken,
  apiRequestRaw,
} from "../../helpers/api-client.js";
import { generateUser } from "../../helpers/test-data.js";

test.describe("Auth & Token Lifecycle (API)", () => {
  test.describe("Registration", () => {
    test("registers a new user and returns accessToken + refreshToken", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      expect(auth.accessToken).toBeTruthy();
      expect(auth.refreshToken).toBeTruthy();
      expect(auth.userId).toBeTruthy();
      expect(auth.email).toBe(user.email);
    });

    test("returns 409 when email already exists", async () => {
      const user = generateUser();
      await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      const res = await apiRequestRaw("POST", "/auth/register", {
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      expect(res.status).toBe(409);
    });

    test("returns 400 when password is too weak", async () => {
      const user = generateUser();
      const res = await apiRequestRaw("POST", "/auth/register", {
        email: user.email,
        password: "123",
        fullName: user.fullName,
        phone: null,
      });
      expect(res.status).toBe(400);
    });

    test("returns 400 when email format is invalid", async () => {
      const res = await apiRequestRaw("POST", "/auth/register", {
        email: "not-an-email",
        password: "Test@1234",
        fullName: "Test",
        phone: null,
      });
      expect(res.status).toBe(400);
    });
  });

  test.describe("Login", () => {
    let userEmail: string;
    let userPassword: string;

    test.beforeAll(async () => {
      const user = generateUser();
      userEmail = user.email;
      userPassword = user.password;
      await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
    });

    test("logs in with valid credentials and returns tokens", async () => {
      const auth = await login({ email: userEmail, password: userPassword });
      expect(auth.accessToken).toBeTruthy();
      expect(auth.refreshToken).toBeTruthy();
    });

    test("returns 401 when password is wrong", async () => {
      const res = await apiRequestRaw("POST", "/auth/login", {
        email: userEmail,
        password: "WrongPassword@1",
      });
      expect(res.status).toBe(401);
    });

    test("returns 401 when email does not exist", async () => {
      const res = await apiRequestRaw("POST", "/auth/login", {
        email: "nonexistent@test.example",
        password: "Test@1234",
      });
      expect(res.status).toBe(401);
    });
  });

  test.describe("Token refresh", () => {
    test("exchanges a valid refresh token for new tokens", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      const refreshed = await refreshToken({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });
      expect(refreshed.accessToken).toBeTruthy();
      expect(refreshed.refreshToken).toBeTruthy();
      expect(refreshed.accessToken).not.toBe(auth.accessToken);
    });

    test("returns 401 when refresh token is invalid", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      const res = await apiRequestRaw("POST", "/auth/refresh", {
        accessToken: auth.accessToken,
        refreshToken: "invalid-refresh-token",
      });
      expect(res.status).toBe(401);
    });

    test("old refresh token is rejected after rotation", async () => {
      const user = generateUser();
      const auth = await register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: null,
      });
      const oldRefresh = auth.refreshToken;
      // Use the refresh token once to trigger rotation
      await refreshToken({
        accessToken: auth.accessToken,
        refreshToken: oldRefresh,
      });
      // The old refresh token must now be rejected
      const res = await apiRequestRaw("POST", "/auth/refresh", {
        accessToken: auth.accessToken,
        refreshToken: oldRefresh,
      });
      expect(res.status).toBe(401);
    });
  });

  test.describe("Protected endpoints", () => {
    test("returns 401 when no Authorization header is sent", async () => {
      const res = await apiRequestRaw("GET", "/gym-houses");
      expect(res.status).toBe(401);
    });

    test("returns 401 when Authorization header contains malformed JWT", async () => {
      const res = await apiRequestRaw(
        "GET",
        "/gym-houses",
        undefined,
        "not-a-jwt",
      );
      expect(res.status).toBe(401);
    });
  });
});
