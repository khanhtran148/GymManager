# Implement State: Phase 5 Communications

## Topic
Phase 5 Communications — Announcements, real-time notifications (SignalR + FCM), notification preferences, read receipts

## Discovery Context
- **Branch**: feat/phase-5-communications
- **Requirements**: Follow the plan exactly as specified in 05-communications.md
- **Test DB Strategy**: Docker containers (Testcontainers with real PostgreSQL)
- **Feature Scope**: fullstack
- **Task Type**: feature

## Phase-Specific Context
- **Plan Source**: docs/plans/gymmanager-platform/phases/05-communications.md
- **Plan Directory**: docs/plans/gymmanager-platform
- **User Modifications**: None — implement as planned

## Plan Summary

### Backend Scope
- 3 enums: TargetAudience, NotificationChannel, DeliveryStatus
- 3 entities: Announcement, NotificationDelivery, NotificationPreference
- 1 domain event: AnnouncementPublishedEvent
- 5 interfaces: IAnnouncementRepository, INotificationDeliveryRepository, INotificationPreferenceRepository, IFirebaseMessagingService, INotificationHub
- 7 handlers: CreateAnnouncement, GetAnnouncements, GetAnnouncementById, GetNotifications, MarkNotificationRead, UpdatePreferences, GetPreferences
- 2 MassTransit consumers: AnnouncementSignalRConsumer, AnnouncementFcmConsumer
- 1 Quartz job: AnnouncementPublisherJob
- 7 API endpoints across AnnouncementsController and NotificationsController
- EF configurations + migration

### Frontend Scope
- Announcement pages: list + create form
- Notification bell component with unread badge
- Notification feed with mark-as-read
- Notification preferences settings page
- SignalR connection setup
- TanStack Query hooks

### Testing
- Domain tests: AnnouncementTests
- Application tests: CreateAnnouncementCommandHandlerTests, MarkNotificationReadCommandHandlerTests
- Infrastructure tests: AnnouncementVisibilityTests
- Consumer tests: SignalR + FCM consumers
- Quartz job tests: AnnouncementPublisherJobTests
- Test builders: Announcement, NotificationDelivery, NotificationPreference
