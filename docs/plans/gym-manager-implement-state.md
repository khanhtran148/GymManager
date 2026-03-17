# GymManager Implement State

## Topic
Bootstrap GymManager — .NET 10 + Next.js + Flutter multi-tenant SaaS platform

## Discovery Context
- branch: initialize new repository
- requirements: Full scaffold as specified — .NET 10 Clean Architecture, Next.js App Router, Flutter mobile
- test_db_strategy: in-memory/mocks (Testcontainers for integration tests only)
- feature_scope: fullstack
- task_type: feature

## Phase-Specific Context
### Plan Summary
Bootstrap entire project from scratch:
1. .NET solution with Domain/Application/Infrastructure/Api/BackgroundServices + 5 test projects
2. Domain skeleton: AuditableEntity, IDomainEvent, Enums (MembershipStatus, SubscriptionType, Permission)
3. Application skeleton: ValidationBehavior, LoggingBehavior, ICurrentUser, IPermissionChecker, Error types, DI
4. Infrastructure skeleton: GymManagerDbContext, DI
5. API skeleton: Program.cs, ApiControllerBase, ExceptionHandlingMiddleware, RateLimitPolicies
6. BackgroundServices skeleton: Program.cs, DI
7. Tests.Common: IntegrationTestBase (Testcontainers PostgreSQL), Builders/
8. Next.js: package.json, layout.tsx, page.tsx, api-client.ts, query-provider.tsx
9. Flutter: pubspec.yaml, main.dart, api_client.dart, app_router.dart, lib/features/
10. Root: .gitignore, Directory.Build.props, Directory.Packages.props, docker-compose.yml, .editorconfig
11. Git init + initial commit

### plan_dir
docs/plans/gym-manager

### Architecture Rules
- All C# classes sealed by default
- File-scoped namespaces
- Primary constructors where appropriate
- Controllers only call Sender.Send()
- All handlers return Result<T> (CSharpFunctionalExtensions)
- No business logic in Infrastructure or Controllers
- ProblemDetails for all API errors
