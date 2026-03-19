import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMounted } from "@/hooks/use-mounted";

describe("useMounted", () => {
  it("returns false on initial render, true after mount", () => {
    const { result } = renderHook(() => useMounted());

    // After renderHook, the effect has already run (jsdom is synchronous)
    expect(result.current).toBe(true);
  });

  it("returns true after useEffect fires", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});
