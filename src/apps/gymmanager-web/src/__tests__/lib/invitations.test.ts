import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock api-client before any imports that use it
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import * as apiClient from "@/lib/api-client";
import {
  getPublicGymHouses,
  createInvitation,
  acceptInvitation,
} from "@/lib/invitations";
import type { GymHousePublic, InvitationResponse } from "@/types/invitation";
import type { AuthResponse } from "@/types/auth";

const mockGymHouses: GymHousePublic[] = [
  { id: "gym-uuid-001", name: "Iron Paradise", address: "123 Muscle St" },
  { id: "gym-uuid-002", name: "FitZone", address: "456 Sweat Ave" },
];

const mockInvitation: InvitationResponse = {
  id: "inv-uuid-001",
  email: "newuser@example.com",
  role: "Trainer",
  gymHouseId: "gym-uuid-001",
  token: "secure-token-abc",
  expiresAt: "2026-04-01T00:00:00Z",
  inviteUrl: "http://localhost:3000/invite/secure-token-abc",
};

const mockAuthResponse: AuthResponse = {
  userId: "user-uuid-001",
  email: "newuser@example.com",
  fullName: "New User",
  accessToken: "access-jwt",
  refreshToken: "refresh-jwt",
  expiresAt: "2026-04-01T00:00:00Z",
};

describe("getPublicGymHouses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /gym-houses/public and returns items array", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ items: mockGymHouses });

    const result = await getPublicGymHouses();

    expect(apiClient.get).toHaveBeenCalledWith("/gym-houses/public");
    expect(result).toEqual(mockGymHouses);
  });

  it("returns empty array when items is empty", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [] });

    const result = await getPublicGymHouses();

    expect(result).toEqual([]);
  });

  it("propagates errors from the API client", async () => {
    const apiError = new Error("Network error");
    vi.mocked(apiClient.get).mockRejectedValueOnce(apiError);

    await expect(getPublicGymHouses()).rejects.toThrow("Network error");
  });
});

describe("createInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /invitations with the correct payload", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockInvitation);

    const result = await createInvitation({
      email: "newuser@example.com",
      role: "Trainer",
      gymHouseId: "gym-uuid-001",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/invitations", {
      email: "newuser@example.com",
      role: "Trainer",
      gymHouseId: "gym-uuid-001",
    });
    expect(result).toEqual(mockInvitation);
  });

  it("propagates 409 conflict errors", async () => {
    const conflictError = { response: { status: 409, data: { detail: "Pending invite exists" } } };
    vi.mocked(apiClient.post).mockRejectedValueOnce(conflictError);

    await expect(
      createInvitation({ email: "dupe@example.com", role: "Staff", gymHouseId: "gym-uuid-001" })
    ).rejects.toEqual(conflictError);
  });
});

describe("acceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /invitations/{token}/accept with fullName and password", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockAuthResponse);

    const result = await acceptInvitation("secure-token-abc", {
      fullName: "New User",
      password: "Passw0rd!",
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/invitations/secure-token-abc/accept",
      { fullName: "New User", password: "Passw0rd!" }
    );
    expect(result).toEqual(mockAuthResponse);
  });

  it("calls POST with empty object when no data is provided", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockAuthResponse);

    await acceptInvitation("some-token", {});

    expect(apiClient.post).toHaveBeenCalledWith(
      "/invitations/some-token/accept",
      {}
    );
  });

  it("propagates 400 errors for expired tokens", async () => {
    const expiredError = {
      response: { status: 400, data: { detail: "Invitation has expired" } },
    };
    vi.mocked(apiClient.post).mockRejectedValueOnce(expiredError);

    await expect(
      acceptInvitation("expired-token", { fullName: "User", password: "Passw0rd!" })
    ).rejects.toEqual(expiredError);
  });

  it("propagates 404 errors for unknown tokens", async () => {
    const notFoundError = {
      response: { status: 404, data: { detail: "Not found" } },
    };
    vi.mocked(apiClient.post).mockRejectedValueOnce(notFoundError);

    await expect(
      acceptInvitation("unknown-token", { fullName: "User", password: "Passw0rd!" })
    ).rejects.toEqual(notFoundError);
  });
});
