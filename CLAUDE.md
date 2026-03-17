# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

GymManager is a multi-tenant SaaS platform for gym owners to manage members, subscriptions, classes, trainers, and payments.

- **API:** .NET 10, Controller-based, Clean Architecture + Vertical Slice
- **Frontend:** Next.js (App Router), TanStack Query, Zustand
- **Mobile:** Flutter (iOS + Android)
- **Database:** PostgreSQL via EF Core + Npgsql
- **Messaging:** RabbitMQ via MassTransit
- **Realtime:** SignalR
- **Background Jobs:** .NET Hosted Services + Quartz.NET
- **Auth:** JWT + Refresh Token

---

## Build & Run Commands

```bash
# Build entire solution
dotnet build

# Run API
dotnet run --project src/apps/GymManager.Api

# Run background services
dotnet run --project src/apps/GymManager.BackgroundServices

# Run all tests
dotnet test

# Run a single test project
dotnet test tests/GymManager.Application.Tests

# Run a specific test
dotnet test --filter "FullyQualifiedName~ClassName.MethodName"

# Start local infra (PostgreSQL + RabbitMQ)
docker compose up -d

# Frontend (Next.js)
cd src/apps/gymmanager-web && npm install && npm run dev

# Mobile (Flutter)
cd src/apps/gymmanager-mobile && flutter pub get && flutter run
```

---

## Solution Structure

```
GymManager.slnx
├── src/
│   ├── core/
│   │   ├── GymManager.Domain/               # Entities, Value Objects, Enums, Domain Events
│   │   ├── GymManager.Application/           # Vertical slices, MediatR, CQRS, Validators
│   │   └── GymManager.Infrastructure/        # EF Core, PostgreSQL, RabbitMQ, JWT
│   └── apps/
│       ├── GymManager.Api/                   # Controllers, Middleware, SignalR Hub
│       ├── GymManager.BackgroundServices/    # Hosted services, Quartz jobs, consumers
│       ├── gymmanager-web/                   # Next.js frontend app
│       └── gymmanager-mobile/                # Flutter mobile app
└── tests/
    ├── GymManager.Tests.Common/              # Shared builders, IntegrationTestBase
    ├── GymManager.Domain.Tests/
    ├── GymManager.Application.Tests/
    ├── GymManager.Infrastructure.Tests/
    └── GymManager.Api.Tests/
```

**Layer dependency rules:**
- Domain → (no references, pure domain)
- Application → Domain
- Infrastructure → Application
- Api / BackgroundServices → Infrastructure + Application

---

## Architecture Rules — Non-Negotiable

1. **Controllers only call `Sender.Send()`** — no direct service injection in controllers
2. **All handlers return `Result<T>` or `Result`** from CSharpFunctionalExtensions
3. **No business logic in Infrastructure layer** — only persistence and external service calls
4. **No business logic in Controllers** — only HTTP mapping
5. **Each feature in its own slice folder** — no cross-slice imports at the handler level
6. **Permission check in every command handler that modifies data** — not in controllers
7. **All API errors return ProblemDetails** (RFC 7807) — never plain strings
8. **All new classes MUST be sealed by default** — unless explicitly designed for inheritance
9. **Test-First Development** — write failing tests first, then implement minimal code, then refactor while green
10. **Message contract immutability** — once published to RabbitMQ, namespace/class names never change

---

## C# Development Standards

### Language & Framework

- **Target Framework:** `net10.0`
- **C# Version:** Latest stable (C# 14 features encouraged)
- **Nullable Reference Types:** Enabled, treat warnings as errors in CI

### Naming Conventions

- **PascalCase:** public types, methods, properties, constants, records
- **camelCase:** locals, parameters
- **_camelCase:** private fields (prefix with `_`)
- **Interfaces:** prefix with `I`
- **Async methods:** end with `Async`

### Modern C# — Prefer

- File-scoped namespace declarations
- Primary constructors for services and handlers
- Pattern matching and switch expressions
- Collection expressions (`[item1, item2]`)
- `nameof` instead of string literals
- `ArgumentNullException.ThrowIfNull(...)` over manual null checks
- `is null` / `is not null` pattern checks

### Class Sealing

All new classes MUST be sealed. Allowed unsealed: domain entities with inheritance hierarchy, abstract base classes (e.g., `AuditableEntity`), framework extensibility classes, test helpers.

### Async/Await

- Use async/await for all I/O operations
- Surface `CancellationToken` on all public async methods
- No `.Result` or `.Wait()` — ever
- `ConfigureAwait(false)` in library code only

---

## CQRS Handler Pattern

```csharp
public sealed record CreateMemberCommand(Guid TenantId, string Name, string Email)
    : IRequest<Result<MemberDto>>;

public sealed class CreateMemberHandler(
    IMemberRepository repository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CreateMemberCommand, Result<MemberDto>>
{
    public async Task<Result<MemberDto>> Handle(
        CreateMemberCommand request, CancellationToken ct)
    {
        // 1. Permission check — always first
        // 2. Validate business rules
        // 3. Create entity
        // 4. Persist
        // 5. Publish domain event
        // 6. Return Result.Success(dto)
    }
}
```

---

## Controller Pattern

```csharp
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class MembersController : ApiControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(MemberDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateMemberCommand cmd, CancellationToken ct)
    {
        var result = await Sender.Send(cmd, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : HandleResult(result);
    }
}
```

---

## Test-First Development — Non-Negotiable

- **Framework:** xUnit + FluentAssertions
- **Integration tests:** Testcontainers with real PostgreSQL
- **Coverage target:** ≥70% on Application layer
- Use `[Theory]` with `[InlineData]` to eliminate test duplication
- Do NOT emit "Arrange", "Act", "Assert" comments
- Use test data builders from `GymManager.Tests.Common`, never raw object construction

---

## Validation & Error Handling

- FluentValidation via `ValidationBehavior<TRequest, TResponse>` MediatR pipeline
- Return `Result<T>`, don't throw for business errors
- Error types: `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`
- `ApiControllerBase.HandleResult()` maps errors to ProblemDetails

---

## Message Contract Immutability — Non-Negotiable

Once domain event contracts are published to RabbitMQ/MassTransit:
- ✅ Add new optional properties with defaults, add new message types, refactor consumer internals
- ❌ Change namespace/class names, remove/rename properties, change property types, make optional → required

Breaking changes: create versioned message (`V2`), dual-publish, migrate consumers, 3-month sunset.

---

## Database Conventions

- All PKs: `UUID` with `gen_random_uuid()`
- All timestamps: `TIMESTAMPTZ` in UTC
- Soft delete: `deleted_at TIMESTAMPTZ NULL` — never hard delete in application code
- Global EF Core query filter: `WHERE deleted_at IS NULL`
- Use projections + `AsNoTracking()` for read queries

---

## API Conventions

- Base route: `/api/v{version:apiVersion}/[controller]`
- Default version: `1.0`
- Error format: `ProblemDetails` (RFC 7807)
- Pagination: `?page=1&pageSize=20` → `{ items: [], totalCount, page, pageSize }`
- Dates: ISO 8601 UTC
- IDs: UUID v4
- `[ProducesResponseType]` on all actions

---

## Rate Limiting Policies

- `RateLimitPolicies.Default` — general endpoints (100/min)
- `RateLimitPolicies.Auth` — login, register (10/min)
- `RateLimitPolicies.Strict` — sensitive operations (5/min)

---

## Permission System

All permission checks go through `IPermissionChecker`. Never inline permission logic in controllers, services, or repositories.

```csharp
var can = await permissions.HasPermission(userId, tenantId, Permission.ManageMembers);
if (!can) return Result.Failure<MemberDto>(new ForbiddenError());
```

---

## Logging

- Structured logging with Serilog
- Use `ILogger<T>` injection
- Use message templates, not string interpolation: `_logger.LogInformation("Processing {MemberId}", id)`
- Include correlation IDs
- Never log passwords, tokens, or PII

---

## Anti-Guessing Rules — Non-Negotiable

**NEVER guess requirements. ALWAYS ask for clarification if ambiguous.**

---

## What Claude Code Should NOT Do

- Write permission resolution logic — human writes this
- Write JWT generation/validation — human reviews all auth code
- Write migration scripts that DROP columns — flag for human review
- Bypass `IPermissionChecker` — never inline permission checks
- Generate seed data with real passwords — use `"Test@1234"`

---

## Cross-Phase Rules

1. No feature creep during a phase — new requests go to backlog
2. Bugs from previous phases take priority over new feature work
3. All migrations backward compatible — never DROP column in same deploy
4. API contracts don't change without version bump and team agreement
5. All realtime features have REST fallback — SignalR is UX enhancement, not correctness dependency
