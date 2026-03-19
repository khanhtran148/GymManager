import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRolesMetadata, ROLES_METADATA_QUERY_KEY } from "@/hooks/use-roles-metadata";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";

// Mock api-client so the hook never makes real HTTP calls
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  apiClient: { get: vi.fn() },
}));

import * as apiClient from "@/lib/api-client";

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useRolesMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses ROLES_METADATA_QUERY_KEY as the query key", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const { result } = renderHook(() => useRolesMetadata(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The query should be cached under the expected key
    const cachedData = client.getQueryData(ROLES_METADATA_QUERY_KEY);
    expect(cachedData).toEqual(testRolesMetadata);
  });

  it("exports ROLES_METADATA_QUERY_KEY as a tuple starting with 'roles-metadata'", () => {
    expect(ROLES_METADATA_QUERY_KEY[0]).toBe("roles-metadata");
  });

  it("configures staleTime as Infinity so data is never considered stale", () => {
    // We verify this indirectly: after a successful fetch, a second render
    // should NOT trigger a refetch (the data is served from cache).
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const { result: r1 } = renderHook(() => useRolesMetadata(), {
      wrapper: makeWrapper(client),
    });

    return waitFor(() => {
      expect(r1.current.isSuccess).toBe(true);
    }).then(() => {
      // Render a second hook instance with the same client — should not call get again
      const callCountAfterFirst = vi.mocked(apiClient.get).mock.calls.length;
      const { result: r2 } = renderHook(() => useRolesMetadata(), {
        wrapper: makeWrapper(client),
      });
      // isSuccess should be immediate from cache
      expect(r2.current.isSuccess).toBe(true);
      expect(vi.mocked(apiClient.get).mock.calls.length).toBe(callCountAfterFirst);
    });
  });

  it("returns data matching RolesMetadata shape on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const { result } = renderHook(() => useRolesMetadata(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      roles: expect.any(Array),
      permissions: expect.any(Array),
      routeAccess: expect.any(Array),
    });
  });

  it("exposes isError true and data undefined when the API call fails", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRolesMetadata(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });

  it("calls GET /roles/metadata", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const { result } = renderHook(() => useRolesMetadata(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith("/roles/metadata");
  });
});
