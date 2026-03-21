# Review Report: Owner Bootstrap & Invite Flow

**Date:** 2026-03-21
**Reviewers:** security-reviewer, quality-reviewer, performance-reviewer, tfd-reviewer

## Summary
1 CRITICAL, 10 HIGH, 8 MEDIUM, 6 LOW/INFO findings across security, quality, performance, and test coverage.

## Critical
1. **AcceptInvitationHandler TOCTOU race** — concurrent requests can redeem the same invite token twice. Fix: atomic `UPDATE ... WHERE accepted_at IS NULL` or EF concurrency token.

## High Priority
2. InviteOptions defaults to http:// — add [Required, Url] + ValidateOnStart
3. SeedOptions lacks password complexity validation
4. CurrentUser.TenantId silent fallback to UserId masks auth bugs
5. JwtTokenService.ResolveTenantIdAsync falls back to user.Id — fabricated tenant claim
6. RegisterCommandHandler accepts any GymHouseId without enrollment control
7. AcceptInvitationHandler existing-user path lacks email ownership verification
8. Result.Failure uses .ToString() on error types — breaks ProblemDetails dispatch
9. JwtTokenService re-reads IConfiguration per call + duplicate ResolveTenantIdAsync calls
10. AcceptInvitationHandler missing test coverage for staff role mapping, null password, idempotent paths

## Medium Priority
11-18: Rate limit verification, PII in logs, DateTime vs DateTimeOffset, inconsistent member code prefix, silent StaffType catch-all, broken CreatedAtAction, sequential DB calls, over-fetching in public gym query.

## Recommendations
- Fix #1 (CRITICAL) and #8 (error types) before merging
- Fix #2-7 (security HIGH) in same PR or follow-up
- Performance items (#9, #17, #18) can be follow-up PR
- Test gaps (#10) should be addressed before merge
