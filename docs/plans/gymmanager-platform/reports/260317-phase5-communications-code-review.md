# Code Review — Phase 5 Communications

**Date:** 2026-03-17
**Reviewers:** security-reviewer, quality-reviewer, performance-reviewer, tfd-reviewer
**Status:** COMPLETED — critical issues fixed

---

## Fixed Issues

### Security (5 fixes applied)
1. **UpdateNotificationPreferencesCommandHandler** — added ICurrentUser injection + ownership check
2. **MarkNotificationReadCommandHandler** — replaced request.CurrentUserId with currentUser.UserId from DI
3. **GetNotificationsQueryHandler** — added ICurrentUser injection + ownership check
4. **AnnouncementsController** — upgraded Create action to RateLimitPolicies.Strict
5. **AnnouncementSignalRConsumer** — removed dead-code "tenant:all" group name

### Quality (3 fixes applied)
1. **Error .ToString() pattern** — verified this matches the established codebase pattern (Phases 1-4 all use .ToString()); no change needed
2. **CreateAnnouncementCommandHandler** — removed redundant double DB fetch of author
3. **ResolveRecipientsAsync** — extracted to shared sealed RecipientResolver class

### Performance (2 fixes applied)
1. **AnnouncementConfiguration** — added composite index on (IsPublished, PublishAt)
2. **AnnouncementPublisherJob** — batch UpdateBatchAsync replaces per-entity SaveChangesAsync

---

## Remaining Issues (deferred)

### Performance — MEDIUM
- N+1 per-recipient preference fetch in both consumers (needs `GetByUserIdsAsync` batch method)
- N+1 UpdateAsync per delivery in FCM consumer (needs batch update)
- Frontend: `invalidateQueries` on every SignalR push (should use `setQueryData` instead)
- SignalR module singleton not guarded against concurrent starts

### Quality — MEDIUM
- Fully-qualified type names in controller `[ProducesResponseType]` attributes
- Request DTOs co-located in controller files instead of dedicated files
- `DateTime` used instead of `DateTimeOffset` on entity timestamp properties
- Magic string "Read" for status comparison in frontend

### TFD — HIGH (coverage gap)
- 5 of 7 handlers have no test files (GetAnnouncements, GetAnnouncementById, GetNotifications, GetPreferences, UpdatePreferences)
- Consumer tests simulate logic inline — actual consumer classes not exercised
- Estimated Application layer coverage ~45%, below 70% target
- Raw object construction in tests instead of builders

### Security — MEDIUM
- JWT token in localStorage (signalr.ts) — should use httpOnly cookie or in-memory store
- CreateAnnouncementCommandHandler permission scope when GymHouseId is null
- No sanitization on inbound SignalR push payloads in notification store

---

## Test Results After Fixes
- Domain: 50 passed
- Application: 115 passed
- Infrastructure: 10 passed
- API: 1 passed
- Frontend: 17 passed
- **Total: 193 passed, 0 failed**
