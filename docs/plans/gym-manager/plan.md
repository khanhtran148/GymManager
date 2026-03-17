# GymManager Bootstrap Plan

## Overview
Bootstrap a complete .NET 10 + Next.js + Flutter multi-tenant SaaS project for gym management.

## Feature Scope
fullstack

## Task Type
feature

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | Version Control | pending |
| 1 | Discovery | completed |
| 2 | Research | completed |
| 3 | Planning | pending |
| 4b | Implementation | pending |
| 5 | Testing | pending |
| 6 | Documentation | pending |

## Success Criteria
- [ ] .NET solution file (GymManager.slnx) created with all projects
- [ ] All .csproj files with correct NuGet packages and project references
- [ ] Domain layer skeleton (AuditableEntity, IDomainEvent, Enums)
- [ ] Application layer skeleton (Behaviors, Interfaces, Error types, DI)
- [ ] Infrastructure layer skeleton (DbContext, DI)
- [ ] API layer skeleton (Program.cs, BaseController, Middleware)
- [ ] BackgroundServices skeleton (Program.cs, DI)
- [ ] Tests.Common skeleton (IntegrationTestBase, Builders/)
- [ ] Next.js frontend scaffold (package.json, layout, page, api-client, query-provider)
- [ ] Flutter mobile scaffold (pubspec.yaml, main.dart, api_client, app_router)
- [ ] Root files (.gitignore, Directory.Build.props, Directory.Packages.props, docker-compose.yml, .editorconfig)
- [ ] Git repo initialized with initial commit
- [ ] `dotnet build` succeeds

## Key Decisions
- All C# classes sealed by default
- File-scoped namespaces
- Primary constructors where appropriate
- Central package management via Directory.Packages.props
- No Docker for tests — Testcontainers only (integration tests)
