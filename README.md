# GymManager

A multi-tenant SaaS platform for gym owners to manage members, subscriptions, classes, trainers, and payments.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | .NET 10, ASP.NET Core, MediatR, EF Core |
| Frontend | Next.js 15 (App Router), TanStack Query, Zustand |
| Mobile | Flutter (iOS + Android), Riverpod, GoRouter |
| Database | PostgreSQL 16 via Npgsql + EF Core |
| Messaging | RabbitMQ via MassTransit |
| Realtime | SignalR |
| Background | Quartz.NET + .NET Hosted Services |
| Auth | JWT + Refresh Token |

---

## Features

**Implemented (Phases 1-2)**

- Multi-tenant architecture with GymHouse-scoped data isolation
- User authentication — register, login, JWT + refresh token rotation
- GymHouse CRUD with owner-scoped access
- Member management with auto-generated member codes
- Subscription lifecycle — create, renew, freeze, cancel
- 26 fine-grained permissions via `IPermissionChecker`
- Booking system — book time slots and class sessions
- Time slot management with capacity tracking
- Class schedule management with trainer assignment
- Waitlist with automatic promotion on cancellation
- Check-in with source tracking (QR scan, manual, kiosk)
- No-show recording
- Pessimistic locking for concurrent booking safety

**Web Dashboard**

- Dark mode, responsive sidebar navigation
- Booking calendar (weekly grid), class schedule management
- Time slot capacity indicators, check-in interface
- Member and subscription CRUD pages

---

## Quick Start

### Prerequisites

- Docker Desktop
- .NET 10 SDK
- Node.js 22+
- Flutter SDK (for mobile)

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL and RabbitMQ.

### 2. Run the API

```bash
dotnet run --project src/apps/GymManager.Api
```

API available at `https://localhost:7000`.

### 3. Run background services

```bash
dotnet run --project src/apps/GymManager.BackgroundServices
```

### 4. Run the web dashboard

```bash
cd src/apps/gymmanager-web
npm install
npm run dev
```

Dashboard available at `http://localhost:3000`.

### 5. Run the mobile app (optional)

```bash
cd src/apps/gymmanager-mobile
flutter pub get
flutter run
```

---

## Solution Structure

```
GymManager.slnx
├── src/
│   ├── core/
│   │   ├── GymManager.Domain/          # Entities, value objects, domain events
│   │   ├── GymManager.Application/     # CQRS handlers, validators, interfaces
│   │   └── GymManager.Infrastructure/  # EF Core, repositories, JWT, RabbitMQ
│   └── apps/
│       ├── GymManager.Api/             # Controllers, middleware, SignalR hub
│       ├── GymManager.BackgroundServices/ # Quartz jobs, MassTransit consumers
│       ├── gymmanager-web/             # Next.js dashboard
│       └── gymmanager-mobile/          # Flutter app
└── tests/
    ├── GymManager.Tests.Common/        # Shared builders, test base
    ├── GymManager.Domain.Tests/
    ├── GymManager.Application.Tests/
    ├── GymManager.Infrastructure.Tests/
    └── GymManager.Api.Tests/
```

For detailed module breakdown, see `docs/plans/gymmanager-platform/phases/00-overview.md`.

---

## Development Commands

```bash
# Build entire solution
dotnet build

# Run all tests
dotnet test

# Run a specific test project
dotnet test tests/GymManager.Application.Tests

# Run a specific test by name
dotnet test --filter "FullyQualifiedName~ClassName.MethodName"

# Apply EF Core migrations
dotnet ef database update --project src/core/GymManager.Infrastructure

# Frontend type-check
cd src/apps/gymmanager-web && npm run build
```

---

## Architecture

The API follows Clean Architecture with Vertical Slice organization:

- Controllers call `Sender.Send()` only — no direct service injection
- Handlers return `Result<T>` from CSharpFunctionalExtensions
- All commands check permissions via `IPermissionChecker` before any business logic
- All errors return ProblemDetails (RFC 7807)
- Tenant isolation enforced at EF Core query filter level (Phase 6 adds PostgreSQL RLS)

Layer dependency order: Domain → Application → Infrastructure → API/BackgroundServices

For architecture decision records, see `docs/adrs/`.

---

## License

MIT
