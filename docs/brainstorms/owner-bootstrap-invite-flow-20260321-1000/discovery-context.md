# Discovery Context — Owner Bootstrap & Invite Flow

**Date:** 2026-03-21
**Topic:** First-time owner account creation + registration role model fix + invite flow for staff

## Requirements
1. **Register = no role.** `/api/v1/auth/register` creates a user with NO role (not Owner). Just an account.
2. **First Owner = env-var seed.** On first startup, read `OWNER_EMAIL` + `OWNER_PASSWORD` from env vars, create Owner if no owners exist. IHostedService, 12-factor.
3. **Staff/Manager via invite links.** Owner generates an invite link with a pre-assigned role. Invitee clicks link, sets password, gets that role.
4. **RegisterCommandHandler must be refactored.** Currently hardcodes `Role.Owner` + `Permission.Admin` — this is wrong per user's intent.

## Context
- Multi-tenant SaaS — Owner's User.Id IS the TenantId
- No Tenant entity exists
- role_permissions table exists but isn't seeded on registration
- Current register flow: creates Owner with Admin — needs to create role-less user instead

## Preferences
- Env-var seed for first owner (12-factor)
- Invite link flow for staff/manager creation
- Register endpoint stays open but creates no-role users
