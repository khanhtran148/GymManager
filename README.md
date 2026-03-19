# GymManager

GymManager is a multi-tenant SaaS platform for gym owners to manage members, subscriptions, classes, trainers, and payments across multiple physical locations. Each location is a `GymHouse`. Gym staff and members access the platform through a web dashboard or mobile app.

Phases 1–5 are complete. Phase 6 (PostgreSQL RLS, load testing, offline mobile) is pending.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | .NET 10, ASP.NET Core, MediatR 13.1.0, EF Core |
| Frontend | Next.js 15 (App Router), TanStack Query 5, Zustand 5 |
| Mobile | Flutter (iOS + Android), Riverpod 2.6.1, go_router 14.6.2 |
| Database | PostgreSQL via Npgsql + EF Core |
| Messaging | RabbitMQ via MassTransit 8.5.8 |
| Realtime | SignalR (`NotificationHub`) |
| Background | Quartz.NET + .NET Hosted Services |
| Auth | JWT (15-min access) + Refresh Token rotation |

---

## Quick Start

**Prerequisites:** Docker Desktop, .NET 10 SDK, Node.js 22+

```bash
# 1. Start PostgreSQL and RabbitMQ
docker compose up -d

# 2. Run the API  (https://localhost:7000)
dotnet run --project src/apps/GymManager.Api

# 3. Run background services (consumers + scheduler)
dotnet run --project src/apps/GymManager.BackgroundServices

# 4. Run the web dashboard  (http://localhost:3000)
cd src/apps/gymmanager-web && npm install && npm run dev

# 5. Run the mobile app (optional)
cd src/apps/gymmanager-mobile && flutter pub get && flutter run
```

Swagger UI is available at `https://localhost:7000/swagger` in development.

---

## Solution Structure

```
GymManager.slnx
├── src/
│   ├── core/
│   │   ├── GymManager.Domain/             # Entities, enums, domain events
│   │   ├── GymManager.Application/        # CQRS handlers, validators, interfaces
│   │   └── GymManager.Infrastructure/     # EF Core, repositories, JWT, MassTransit
│   └── apps/
│       ├── GymManager.Api/                # Controllers, middleware, SignalR hub
│       ├── GymManager.BackgroundServices/ # Quartz jobs, MassTransit consumers
│       ├── gymmanager-web/                # Next.js dashboard
│       └── gymmanager-mobile/             # Flutter app
└── tests/
    ├── GymManager.Tests.Common/           # Shared builders, test base
    ├── GymManager.Domain.Tests/
    ├── GymManager.Application.Tests/
    ├── GymManager.Infrastructure.Tests/
    └── GymManager.Api.Tests/
```

---

## Development Commands

```bash
dotnet build                                        # Build entire solution
dotnet test                                         # Run all tests
dotnet test tests/GymManager.Application.Tests      # Single test project
dotnet test --filter "FullyQualifiedName~ClassName.MethodName"
dotnet ef database update --project src/core/GymManager.Infrastructure
```

---

## Architecture Highlights

- Controllers call `Sender.Send()` only — no direct service injection
- All handlers return `Result<T>` (CSharpFunctionalExtensions)
- Every command checks `IPermissionChecker` before executing business logic
- All errors return ProblemDetails (RFC 7807) with a `[PREFIX]` dispatch convention
- Tenant isolation enforced via EF Core global query filters on `GymHouseId`

See [`CLAUDE.md`](CLAUDE.md) for development standards and [`docs/`](docs/) for detailed documentation.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/architecture.md`](docs/architecture.md) | System diagrams, auth flow, booking flow, multi-tenancy |
| [`docs/api-reference.md`](docs/api-reference.md) | All REST endpoints, request/response shapes, error format |
| [`docs/codebase-summary.md`](docs/codebase-summary.md) | Entity inventory, frontend routes, infrastructure components |
| [`docs/product-overview.md`](docs/product-overview.md) | Product vision, user roles, core features |
| [`docs/domain-glossary.md`](docs/domain-glossary.md) | Domain entities, business terms, enum values |
| [`docs/doc-index.md`](docs/doc-index.md) | Full documentation index |

---

## License

MIT
