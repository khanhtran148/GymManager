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
    return {
      role: claims.role as string,
      permissions: claims.permissions as string,
    };
  } catch {
    return null;
  }
}
