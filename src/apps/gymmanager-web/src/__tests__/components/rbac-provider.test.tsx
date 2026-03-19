import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRbacStore } from "@/stores/rbac-store";
import { testRolesMetadata } from "@/__tests__/fixtures/rbac-metadata";
import { RbacProvider } from "@/components/rbac-provider";

// Mock api-client
vi.mock("@/lib/api-client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  apiClient: { get: vi.fn() },
}));

import * as apiClient from "@/lib/api-client";

// Mock document.cookie writes so btoa side-effects don't pollute tests
let cookieStore: Record<string, string> = {};
Object.defineProperty(document, "cookie", {
  get: () =>
    Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  set: (value: string) => {
    const [nameValue] = value.split(";");
    const [name, val] = nameValue.split("=");
    if (val === "" || value.includes("max-age=0")) {
      delete cookieStore[name.trim()];
    } else {
      cookieStore[name.trim()] = val?.trim() ?? "";
    }
  },
  configurable: true,
});

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("RbacProvider", () => {
  beforeEach(() => {
    cookieStore = {};
    vi.clearAllMocks();
    useRbacStore.getState().reset();
  });

  afterEach(() => {
    useRbacStore.getState().reset();
  });

  it("shows loading skeleton while the query is pending", () => {
    // Never resolve so we stay in loading state
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    // Loading skeleton is aria-busy
    expect(screen.getByLabelText("Loading permissions...")).toBeInTheDocument();
    // Children should NOT be rendered
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
  });

  it("renders children after successful metadata load", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("child content")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Loading permissions...")).not.toBeInTheDocument();
  });

  it("calls setMetadata on the store after a successful fetch", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(useRbacStore.getState().isLoaded).toBe(true);
    });

    expect(useRbacStore.getState().roles).toEqual(testRolesMetadata.roles);
  });

  it("writes the route_access cookie after a successful fetch", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(testRolesMetadata);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(cookieStore["route_access"]).toBeDefined();
    });

    // The cookie value should be base64-encoded JSON of routeAccess
    const decoded = JSON.parse(atob(cookieStore["route_access"]));
    expect(Array.isArray(decoded)).toBe(true);
    expect(decoded[0]).toHaveProperty("path");
    expect(decoded[0]).toHaveProperty("allowedRoles");
  });

  it("shows the error fallback (not the skeleton) when the API call fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to load permissions")).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Loading permissions...")).not.toBeInTheDocument();
  });

  it("shows a Retry button in the error fallback", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  it("retries the query when the Retry button is clicked", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(testRolesMetadata);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <RbacProvider>
          <div>child content</div>
        </RbacProvider>
      </QueryClientProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    // Click Retry
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    // After successful retry, children should appear
    await waitFor(() => {
      expect(screen.getByText("child content")).toBeInTheDocument();
    });
  });
});
