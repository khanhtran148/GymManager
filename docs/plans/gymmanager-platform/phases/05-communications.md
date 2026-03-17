## Phase 5: Communications

### Objective

Deliver announcement creation with scheduled publishing, real-time notification delivery via SignalR, push notifications via FCM, per-user notification preferences, and read receipt tracking.

### Dependencies

Phase 1 (User, GymHouse, Member). SignalR hub already exists.

### 5.1 Domain Layer

#### Enums to Add

- `TargetAudience.cs` -- `AllMembers, ActiveMembers, Staff, Trainers, Everyone`
- `NotificationChannel.cs` -- `InApp, Push, Email`
- `DeliveryStatus.cs` -- `Pending, Sent, Delivered, Read, Failed`

#### Entities to Create

**14. Announcement** -- `src/core/GymManager.Domain/Entities/Announcement.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid? | null = chain-wide (Owner only) |
| AuthorId | Guid | FK to User |
| Title | string | |
| Content | string | |
| TargetAudience | TargetAudience | |
| PublishAt | DateTime | scheduled publish time |
| IsPublished | bool | set by Quartz job |
| PublishedAt | DateTime? | |

**15. NotificationDelivery** -- `src/core/GymManager.Domain/Entities/NotificationDelivery.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| AnnouncementId | Guid | FK |
| RecipientId | Guid | FK to User |
| Channel | NotificationChannel | |
| Status | DeliveryStatus | |
| SentAt | DateTime? | |
| ReadAt | DateTime? | |

**16. NotificationPreference** -- `src/core/GymManager.Domain/Entities/NotificationPreference.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| UserId | Guid | FK to User |
| Channel | NotificationChannel | |
| IsEnabled | bool | |

#### Domain Events

- `AnnouncementPublishedEvent(Guid AnnouncementId, Guid? GymHouseId, TargetAudience Audience)`

### 5.2 Application Layer

#### Interfaces

- `IAnnouncementRepository.cs` -- CRUD, `GetDueForPublishingAsync()`, `GetByHouseAsync(paged)`
- `INotificationDeliveryRepository.cs` -- `CreateBatchAsync`, `MarkReadAsync`, `GetByRecipientAsync(paged)`
- `INotificationPreferenceRepository.cs` -- `GetByUserIdAsync`, `UpsertAsync`
- `IFirebaseMessagingService.cs` -- `SendMulticastAsync(deviceTokens, title, body)`
- `INotificationHub.cs` -- `SendToGroupAsync(groupName, payload)` (abstraction over SignalR)

#### Feature Slices

Folder: `src/core/GymManager.Application/Announcements/`

| Slice | Type | Permission |
|-------|------|------------|
| `CreateAnnouncement/CreateAnnouncementCommand.cs` | Command | ManageAnnouncements |
| `CreateAnnouncement/CreateAnnouncementCommandHandler.cs` | Handler | validate chain-wide requires Owner |
| `GetAnnouncements/GetAnnouncementsQuery.cs` | Query (paged) | ViewAnnouncements |
| `GetAnnouncementById/GetAnnouncementByIdQuery.cs` | Query | ViewAnnouncements |

Folder: `src/core/GymManager.Application/Notifications/`

| Slice | Type | Permission |
|-------|------|------------|
| `GetNotifications/GetNotificationsQuery.cs` | Query | (self only) |
| `MarkNotificationRead/MarkNotificationReadCommand.cs` | Command | (self only) |
| `UpdatePreferences/UpdateNotificationPreferencesCommand.cs` | Command | (self only) |
| `GetPreferences/GetNotificationPreferencesQuery.cs` | Query | (self only) |

#### Quartz Job

- `src/apps/GymManager.BackgroundServices/Jobs/AnnouncementPublisherJob.cs`
  - Runs every 30 seconds
  - Queries `announcements WHERE publish_at <= now AND is_published = false`
  - Sets `IsPublished = true`, `PublishedAt = now`
  - Publishes `AnnouncementPublishedEvent` to MassTransit

#### MassTransit Consumers

- `AnnouncementSignalRConsumer.cs` -- on `AnnouncementPublishedEvent`: resolve recipients by audience + house, filter by preferences (InApp enabled), create NotificationDelivery rows, send via SignalR hub to tenant group
- `AnnouncementFcmConsumer.cs` -- on `AnnouncementPublishedEvent`: resolve recipients with Push preference enabled, get device tokens, send via FCM, create NotificationDelivery rows

### 5.3 Infrastructure Layer

#### EF Configurations

- `AnnouncementConfiguration.cs` -- query filter on GymHouseId (special: null GymHouseId = chain-wide, visible to all), index on (GymHouseId, PublishAt)
- `NotificationDeliveryConfiguration.cs` -- index on (RecipientId, Status), index on AnnouncementId
- `NotificationPreferenceConfiguration.cs` -- unique on (UserId, Channel)

#### Services

- `Notifications/FirebaseMessagingService.cs` -- wraps Firebase Admin SDK
- `Notifications/SignalRNotificationHub.cs` -- implements `INotificationHub`, wraps `IHubContext<NotificationHub>`

#### NotificationHub Update

Extend `NotificationHub` in API to support:
- `OnConnectedAsync` -- already joins tenant group (existing)
- Add user-specific group: `user:{userId}` for targeted notifications

#### Migration

- `dotnet ef migrations add AddCommunicationEntities`

### 5.4 API Layer

**AnnouncementsController** -- `Controllers/AnnouncementsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/announcements` | Default |
| GET | `/api/v1/announcements` | Default |
| GET | `/api/v1/announcements/{id}` | Default |

**NotificationsController** -- `Controllers/NotificationsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| GET | `/api/v1/notifications` | Default |
| PATCH | `/api/v1/notifications/{id}/read` | Default |
| GET | `/api/v1/notification-preferences` | Default |
| PUT | `/api/v1/notification-preferences` | Default |

### 5.5 Web Frontend

#### Announcement Composer

- `src/app/(dashboard)/announcements/page.tsx` -- list of announcements with status (Scheduled, Published), create button
- `src/app/(dashboard)/announcements/new/page.tsx` -- form: title, content (rich text), target audience dropdown, schedule date/time picker, house scope selector (chain-wide for owners)
- `src/hooks/use-announcements.ts`

#### Notification Feed

- `src/components/notification-bell.tsx` -- bell icon in top bar with unread count badge, dropdown showing recent notifications
- `src/components/notification-feed.tsx` -- full notification list with mark-as-read
- `src/hooks/use-notifications.ts` -- TanStack Query + SignalR subscription for real-time updates
- `src/lib/signalr.ts` -- SignalR connection setup, auto-reconnect

#### Notification Preferences

- `src/app/(dashboard)/settings/notifications/page.tsx` -- toggle InApp, Push, Email per notification type

#### Sidebar Update

Add Announcements nav item.

### 5.6 Tests

#### Domain Tests

- `Entities/AnnouncementTests.cs` -- chain-wide requires null GymHouseId, publish sets IsPublished

#### Application Tests

- `Announcements/CreateAnnouncementCommandHandlerTests.cs` -- success, chain-wide without Owner role returns forbidden, scheduled in past returns validation error
- `Notifications/MarkNotificationReadCommandHandlerTests.cs` -- sets ReadAt, not own notification returns forbidden

#### Infrastructure Tests

- `Persistence/AnnouncementVisibilityTests.cs` -- chain-wide announcement visible from any house context, house-scoped not visible from other house

#### Consumer Tests

- `Consumers/AnnouncementSignalRConsumerTests.cs` -- creates delivery records, respects user preferences
- `Consumers/AnnouncementFcmConsumerTests.cs` -- sends to correct device tokens

#### Quartz Job Tests

- `Jobs/AnnouncementPublisherJobTests.cs` -- publishes due announcements, skips already published, skips future

#### Test Builders

- `Builders/AnnouncementBuilder.cs`
- `Builders/NotificationDeliveryBuilder.cs`
- `Builders/NotificationPreferenceBuilder.cs`

### 5.7 Acceptance Criteria

- [ ] Announcement created with scheduled publish time
- [ ] Quartz job publishes due announcements every 30s
- [ ] SignalR pushes notification to connected web clients in tenant group
- [ ] FCM sends push to mobile devices of targeted recipients
- [ ] Per-user notification preferences respected (disabled channels skipped)
- [ ] Read receipts tracked (ReadAt set on mark-read)
- [ ] Chain-wide announcements require Owner permission
- [ ] Web: announcement composer, notification bell with real-time updates, preferences page

