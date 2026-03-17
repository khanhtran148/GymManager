import { decodeJwt } from "jose";

export interface JwtPermissionClaims {
  role: string;
  permissions: string;
}

/**
 * Decode role and permissions claims from a JWT access token.
 *
 * Uses jose decodeJwt (no signature verification).
 * Frontend decode is UX-only; the backend enforces security.
 */
export function decodePermissionClaims(token: string): JwtPermissionClaims | null {
  try {
    const claims = decodeJwt(token);
    const role = typeof claims.role === "string" ? claims.role : null;
    const permissions = typeof claims.permissions === "string" ? claims.permissions : null;
    if (!role || !permissions) return null;
    return { role, permissions };
  } catch {
    return null;
  }
}
