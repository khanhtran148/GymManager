# API Contract: Owner Bootstrap & Invite Flow

**Date:** 2026-03-21
**Version:** 1.0

## Endpoints

### 1. Register (Modified)

```
POST /api/v1/auth/register
Auth: none
Rate limit: Auth (10/min)
```

**Request:**
```json
{
  "email": "string (required)",
  "password": "string (required, min 8, upper+lower+digit+special)",
  "fullName": "string (required, max 200)",
  "phone": "string? (optional)",
  "gymHouseId": "uuid (required)"
}
```

**Response 200:**
```json
{
  "userId": "uuid",
  "email": "string",
  "fullName": "string",
  "accessToken": "string (JWT with tenant_id claim)",
  "refreshToken": "string",
  "expiresAt": "ISO 8601 UTC"
}
```

**Errors:**
- 400: Invalid input / GymHouse not found
- 409: Email already registered

**Breaking change:** `gymHouseId` is now required. Frontend/mobile must update simultaneously.

---

### 2. List Public Gym Houses

```
GET /api/v1/gym-houses/public
Auth: none
Rate limit: Default (100/min)
```

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "address": "string"
    }
  ]
}
```

Purpose: Allows registration form to present a gym picker.

---

### 3. Create Invitation

```
POST /api/v1/invitations
Auth: Bearer (Owner or Manager with ManageStaff/ManageRoles)
Rate limit: Default (100/min)
```

**Request:**
```json
{
  "email": "string (required, valid email)",
  "role": "string (required, one of: HouseManager, Trainer, Staff, Member)",
  "gymHouseId": "uuid (required)"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "string",
  "role": "string",
  "gymHouseId": "uuid",
  "token": "string (URL-safe base64, 32 bytes)",
  "expiresAt": "ISO 8601 UTC",
  "inviteUrl": "string (frontend URL with token)"
}
```

**Errors:**
- 400: Invalid role / GymHouse not found
- 403: Insufficient permissions
- 409: Pending invite already exists for (email, tenant_id)

**Constraint:** Cannot invite as Owner role.

---

### 4. Accept Invitation

```
POST /api/v1/invitations/{token}/accept
Auth: none (anonymous)
Rate limit: Auth (10/min)
```

**Request:**
```json
{
  "password": "string (required if new user, same validation as register)",
  "fullName": "string (required if new user, max 200)"
}
```

**Response 200:**
```json
{
  "userId": "uuid",
  "email": "string",
  "fullName": "string",
  "accessToken": "string (JWT with tenant_id claim)",
  "refreshToken": "string",
  "expiresAt": "ISO 8601 UTC"
}
```

**Errors:**
- 400: Token expired / already accepted / invalid password
- 404: Token not found

**Behavior:**
- If user with email exists: link to gym, assign role, return tokens
- If no user exists: create user with password/fullName, link to gym, assign role, return tokens

---

## JWT Claims (Updated)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "Member",
  "permissions": "12345 (bitmask as long)",
  "tenant_id": "owner-uuid (the tenant/owner this user belongs to)"
}
```

`tenant_id` derivation:
- Owner: `tenant_id = user.Id`
- Non-owner: `tenant_id = gymHouse.OwnerId` (resolved at token issuance)

---

## TypeScript Interfaces (Frontend)

```typescript
// Updated
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  gymHouseId: string;
}

// New
export interface GymHousePublic {
  id: string;
  name: string;
  address: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: 'HouseManager' | 'Trainer' | 'Staff' | 'Member';
  gymHouseId: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: string;
  gymHouseId: string;
  token: string;
  expiresAt: string;
  inviteUrl: string;
}

export interface AcceptInvitationRequest {
  password?: string;
  fullName?: string;
}
```
