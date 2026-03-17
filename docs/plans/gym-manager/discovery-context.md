# Discovery Context — GymManager

## Project Description
Multi-tenant SaaS platform for gym owners to manage members, subscriptions, classes, trainers, and payments.

## Tech Stack (Confirmed)
- **API:** .NET 10, Controller-based, Clean Architecture + Vertical Slice + CQRS (MediatR)
- **Frontend:** Next.js (App Router), TanStack Query, Zustand
- **Mobile:** Flutter (iOS + Android)
- **Database:** PostgreSQL via EF Core + Npgsql
- **Messaging:** RabbitMQ via MassTransit
- **Realtime:** SignalR
- **Background Jobs:** .NET Hosted Services + Quartz.NET
- **Auth:** JWT + Refresh Token
- **Testing:** xUnit + FluentAssertions + NSubstitute + Testcontainers

## Architecture Principles
Migrated from TeamFlow CLAUDE.md — same non-negotiable rules apply:
- Controllers only call Sender.Send()
- All handlers return Result<T> from CSharpFunctionalExtensions
- No business logic in Infrastructure or Controllers
- Each feature in its own slice folder
- Permission check in every command handler
- All classes sealed by default
- Test-First Development
- ProblemDetails for all API errors
- Message contract immutability

## Git Strategy
Initialize new repository.
