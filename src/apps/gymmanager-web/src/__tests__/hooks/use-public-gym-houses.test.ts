import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock the invitations lib so no real HTTP calls happen
vi.mock("@/lib/invitations", () => ({
  getPublicGymHouses: vi.fn(),
  createInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}));

// Also mock api-client to prevent accidental real calls
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import * as invitationsLib from "@/lib/invitations";
import { usePublicGymHouses } from "@/hooks/use-gym-houses";
import type { GymHousePublic } from "@/types/invitation";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockGyms: GymHousePublic[] = [
  { id: "gym-001", name: "Iron Paradise", address: "123 Muscle St" },
  { id: "gym-002", name: "FitZone", address: "456 Sweat Ave" },
];

describe("usePublicGymHouses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns gym house list on success", async () => {
    vi.mocked(invitationsLib.getPublicGymHouses).mockResolvedValueOnce(mockGyms);

    const { result } = renderHook(() => usePublicGymHouses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockGyms);
    expect(invitationsLib.getPublicGymHouses).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no gyms exist", async () => {
    vi.mocked(invitationsLib.getPublicGymHouses).mockResolvedValueOnce([]);

    const { result } = renderHook(() => usePublicGymHouses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("returns isError true on API failure", async () => {
    vi.mocked(invitationsLib.getPublicGymHouses).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => usePublicGymHouses(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("is in loading state initially", () => {
    vi.mocked(invitationsLib.getPublicGymHouses).mockResolvedValue(mockGyms);

    const { result } = renderHook(() => usePublicGymHouses(), {
      wrapper: makeWrapper(),
    });

    // Initially pending
    expect(result.current.isPending).toBe(true);
  });
});
