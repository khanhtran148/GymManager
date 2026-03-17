import { describe, it, expect } from "vitest";
import { decodePermissionClaims } from "@/lib/jwt";

// Helper to create a minimal unsigned JWT with given payload
function makeUnsignedJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.`;
}

describe("decodePermissionClaims", () => {
  it("extracts role and permissions from a valid JWT", () => {
    const token = makeUnsignedJwt({
      sub: "user-123",
      role: "Owner",
      permissions: "67108863",
    });

    const claims = decodePermissionClaims(token);
    expect(claims).not.toBeNull();
    expect(claims!.role).toBe("Owner");
    expect(claims!.permissions).toBe("67108863");
  });

  it("returns null for a completely invalid token", () => {
    expect(decodePermissionClaims("not-a-jwt")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodePermissionClaims("")).toBeNull();
  });

  it("handles tokens with missing role claim gracefully", () => {
    const token = makeUnsignedJwt({
      sub: "user-123",
      permissions: "100",
    });

    const claims = decodePermissionClaims(token);
    expect(claims).not.toBeNull();
    expect(claims!.role).toBeUndefined();
    expect(claims!.permissions).toBe("100");
  });

  it("handles tokens with missing permissions claim gracefully", () => {
    const token = makeUnsignedJwt({
      sub: "user-123",
      role: "Member",
    });

    const claims = decodePermissionClaims(token);
    expect(claims).not.toBeNull();
    expect(claims!.role).toBe("Member");
    expect(claims!.permissions).toBeUndefined();
  });
});
