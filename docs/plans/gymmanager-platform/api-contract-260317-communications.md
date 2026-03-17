# API Contract: Phase 5 — Communications

**Date:** 2026-03-17
**Feature:** Announcements + Notifications
**Base URL:** `/api/v1`
**Auth:** JWT Bearer (all endpoints require `[Authorize]` unless stated)

---

## Shared TypeScript Interfaces

```typescript
// types/announcement.ts

export type TargetAudience = "AllMembers" | "ActiveMembers" | "Staff" | "Trainers" | "Everyone";

export interface AnnouncementDto {
  id: string;          // UUID
  gymHouseId: string | null;  // null = chain-wide
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string;   // ISO 8601 UTC
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  gymHouseId: string | null;   // null = chain-wide (Owner only)
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string;            // ISO 8601 UTC
}

export interface AnnouncementListResponse {
  items: AnnouncementDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

```typescript
// types/notification.ts

export type NotificationChannel = "InApp" | "Push" | "Email";
export type DeliveryStatus = "Pending" | "Sent" | "Delivered" | "Read" | "Failed";

export interface NotificationDto {
  id: string;           // UUID — NotificationDelivery.Id
  announcementId: string;
  announcementTitle: string;
  announcementContent: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt: string | null;
  readAt: string | null;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationPreferenceDto {
  channel: NotificationChannel;
  isEnabled: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Array<{
    channel: NotificationChannel;
    isEnabled: boolean;
  }>;
}

// SignalR real-time payload (pushed on new notification)
export interface NotificationPushPayload {
  notificationId: string;
  announcementId: string;
  title: string;
  content: string;
  channel: NotificationChannel;
}
```

---

## Endpoints

### AnnouncementsController

**Route prefix:** `/api/v1/announcements`
**Rate limit:** `RateLimitPolicies.Default` (100/min)

#### POST `/api/v1/announcements`

Create a new announcement (scheduled or immediate).

**Auth:** Required. `Permission.ManageAnnouncements`.
**Additional rule:** If `gymHouseId == null` (chain-wide), caller must have `Role.Owner`.

**Request body:**
```json
{
  "gymHouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",  // or null for chain-wide
  "title": "Grand Opening Promo",
  "content": "50% off all memberships this week!",
  "targetAudience": "AllMembers",
  "publishAt": "2026-03-20T09:00:00Z"
}
```

**Responses:**
| Status | Body | Notes |
|--------|------|-------|
| 201 Created | `AnnouncementDto` | Location header: `/api/v1/announcements/{id}` |
| 400 Bad Request | `ProblemDetails` | Validation failure (e.g. publishAt in past, empty title) |
| 403 Forbidden | `ProblemDetails` | Missing permission or non-Owner trying chain-wide |

**C# Command:**
```csharp
public sealed record CreateAnnouncementCommand(
    Guid? GymHouseId,
    Guid AuthorId,
    string Title,
    string Content,
    TargetAudience TargetAudience,
    DateTime PublishAt)
    : IRequest<Result<AnnouncementDto>>;
```

**Validator rules:**
- `Title`: not empty, max 200 chars
- `Content`: not empty, max 5000 chars
- `PublishAt`: must be >= `DateTime.UtcNow` (not in past)
- `TargetAudience`: valid enum value

---

#### GET `/api/v1/announcements`

Paginated list of announcements visible to the caller's gym house.

**Auth:** Required. `Permission.ViewAnnouncements`.

**Query parameters:**
| Name | Type | Default | Notes |
|------|------|---------|-------|
| `gymHouseId` | `Guid` | required | House context |
| `page` | `int` | 1 | |
| `pageSize` | `int` | 20 | max 100 |

**Responses:**
| Status | Body |
|--------|------|
| 200 OK | `AnnouncementListResponse` |
| 403 Forbidden | `ProblemDetails` |

**C# Query:**
```csharp
public sealed record GetAnnouncementsQuery(
    Guid GymHouseId,
    int Page,
    int PageSize)
    : IRequest<Result<PagedList<AnnouncementDto>>>;
```

**Repo behavior:** Returns announcements WHERE `(gym_house_id = @gymHouseId OR gym_house_id IS NULL)` AND `is_published = true`, ordered by `published_at DESC`.

---

#### GET `/api/v1/announcements/{id}`

Get single announcement by ID.

**Auth:** Required. `Permission.ViewAnnouncements`.

**Path parameters:** `id` — UUID

**Responses:**
| Status | Body |
|--------|------|
| 200 OK | `AnnouncementDto` |
| 403 Forbidden | `ProblemDetails` |
| 404 Not Found | `ProblemDetails` |

**C# Query:**
```csharp
public sealed record GetAnnouncementByIdQuery(
    Guid Id,
    Guid GymHouseId)
    : IRequest<Result<AnnouncementDto>>;
```

---

### NotificationsController

**Route prefix:** `/api/v1/notifications`
**Rate limit:** `RateLimitPolicies.Default`
**Note:** All notification endpoints are "self-only" — no permission flags needed; handler enforces `RecipientId == currentUser.UserId`.

#### GET `/api/v1/notifications`

Get paginated list of the current user's notifications.

**Auth:** Required.

**Query parameters:**
| Name | Type | Default |
|------|------|---------|
| `page` | `int` | 1 |
| `pageSize` | `int` | 20 |

**Responses:**
| Status | Body |
|--------|------|
| 200 OK | `NotificationListResponse` |

**C# Query:**
```csharp
public sealed record GetNotificationsQuery(
    Guid RecipientId,
    int Page,
    int PageSize)
    : IRequest<Result<PagedList<NotificationDto>>>;
```

---

#### PATCH `/api/v1/notifications/{id}/read`

Mark a notification as read. Sets `ReadAt = now`, `Status = Read`.

**Auth:** Required. Handler enforces `RecipientId == currentUser.UserId`.

**Path parameters:** `id` — UUID (NotificationDelivery.Id)

**Responses:**
| Status | Body |
|--------|------|
| 204 No Content | — |
| 403 Forbidden | `ProblemDetails` — notification belongs to another user |
| 404 Not Found | `ProblemDetails` |

**C# Command:**
```csharp
public sealed record MarkNotificationReadCommand(
    Guid NotificationId,
    Guid CurrentUserId)
    : IRequest<Result>;
```

---

#### GET `/api/v1/notification-preferences`

Get current user's notification preferences (one entry per channel).

**Auth:** Required.

**Responses:**
| Status | Body |
|--------|------|
| 200 OK | `NotificationPreferenceDto[]` |

**C# Query:**
```csharp
public sealed record GetNotificationPreferencesQuery(
    Guid UserId)
    : IRequest<Result<List<NotificationPreferenceDto>>>;
```

**Notes:** If user has no saved preferences, return defaults (all channels enabled).

---

#### PUT `/api/v1/notification-preferences`

Upsert the current user's notification preferences.

**Auth:** Required.

**Request body:**
```json
{
  "preferences": [
    { "channel": "InApp", "isEnabled": true },
    { "channel": "Push", "isEnabled": false },
    { "channel": "Email", "isEnabled": true }
  ]
}
```

**Responses:**
| Status | Body |
|--------|------|
| 204 No Content | — |
| 400 Bad Request | `ProblemDetails` |

**C# Command:**
```csharp
public sealed record UpdateNotificationPreferencesCommand(
    Guid UserId,
    List<NotificationPreferenceItem> Preferences)
    : IRequest<Result>;

public sealed record NotificationPreferenceItem(
    NotificationChannel Channel,
    bool IsEnabled);
```

---

## C# Response DTOs

```csharp
// Announcements/Shared/AnnouncementDto.cs
public sealed record AnnouncementDto(
    Guid Id,
    Guid? GymHouseId,
    Guid AuthorId,
    string AuthorName,
    string Title,
    string Content,
    TargetAudience TargetAudience,
    DateTime PublishAt,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt);

// Notifications/Shared/NotificationDto.cs
public sealed record NotificationDto(
    Guid Id,
    Guid AnnouncementId,
    string AnnouncementTitle,
    string AnnouncementContent,
    NotificationChannel Channel,
    DeliveryStatus Status,
    DateTime? SentAt,
    DateTime? ReadAt);

// Notifications/Shared/NotificationPreferenceDto.cs
public sealed record NotificationPreferenceDto(
    NotificationChannel Channel,
    bool IsEnabled);
```

---

## SignalR Contract

**Hub URL:** `/hubs/notifications`
**Hub method (server → client):** `ReceiveNotification`

**Client listens to:**
```typescript
connection.on("ReceiveNotification", (payload: NotificationPushPayload) => { ... });
```

**Payload structure:**
```json
{
  "notificationId": "uuid",
  "announcementId": "uuid",
  "title": "Grand Opening Promo",
  "content": "50% off all memberships this week!",
  "channel": "InApp"
}
```

**Group strategy:**
- `tenant:{gymHouseId}` — broadcast to all connected users in a gym house (existing)
- `user:{userId}` — targeted delivery to a specific user (new in Phase 5)

**`INotificationHub` interface:**
```csharp
public interface INotificationHub
{
    Task SendToGroupAsync(string groupName, string method, object payload, CancellationToken ct = default);
}
```

---

## MassTransit Event Contract

```csharp
// Domain/Events/AnnouncementPublishedEvent.cs
public sealed record AnnouncementPublishedEvent(
    Guid AnnouncementId,
    Guid? GymHouseId,
    TargetAudience Audience)
    : IDomainEvent;
```

**Immutability note:** Once this contract is published, namespace and property names must not change per CLAUDE.md message contract rules.

---

## TBD / Open Questions

None. All decisions pre-confirmed in state file.

---

## Success Criteria Checklist

- [ ] Announcement created with scheduled publish time
- [ ] Quartz job publishes due announcements every 30s
- [ ] SignalR pushes notification to connected web clients in tenant group
- [ ] FCM sends push to mobile devices of targeted recipients
- [ ] Per-user notification preferences respected (disabled channels skipped)
- [ ] Read receipts tracked (ReadAt set on mark-read)
- [ ] Chain-wide announcements require Owner permission
- [ ] Web: announcement composer, notification bell with real-time updates, preferences page
