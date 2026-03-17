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

  it("returns null for tokens with missing role claim", () => {
    const token = makeUnsignedJwt({
      sub: "user-123",
      permissions: "100",
    });

    expect(decodePermissionClaims(token)).toBeNull();
  });

  it("returns null for tokens with missing permissions claim", () => {
    const token = makeUnsignedJwt({
      sub: "user-123",
      role: "Member",
    });

    expect(decodePermissionClaims(token)).toBeNull();
  });
});
