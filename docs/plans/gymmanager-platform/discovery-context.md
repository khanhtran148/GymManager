# Discovery Context — GymManager Platform Plan

## Requirements
Implement the full GymManager platform as defined in:
- ADR: docs/adrs/260317-gymmanager-platform-architecture.md
- Brainstorm results: docs/brainstorms/gym-management-platform-20260317-1100/brainstorm-results.md

## Scope
Fullstack — All 6 phases covering the complete platform:
1. Foundation (GymHouse, User, Member, Subscription, Permissions, multi-tenancy)
2. Booking (TimeSlot, ClassSchedule, Booking, Waitlist, check-in)
3. Finance (Transaction ledger, P&L reports, revenue dashboards)
4. Staff/HR (Staff, ShiftAssignment, Payroll with approval workflow)
5. Communications (Announcements, SignalR notifications, Firebase push)
6. Hardening (PostgreSQL RLS, load testing, offline mobile, payment gateway)

## Success Criteria
- API builds with zero warnings, all tests pass against real PostgreSQL (Testcontainers)
- Next.js web dashboard functional with basic CRUD screens for each domain
- Each phase deliverable is independently deployable
- Multi-tenancy isolation verified with integration tests per phase

## Tech Stack
- Backend: .NET 10, Clean Architecture + CQRS (MediatR 13.1.0), EF Core, PostgreSQL
- Frontend: Next.js (App Router), TanStack Query, Zustand, Tailwind CSS
- Mobile: Flutter (iOS + Android) — later phases
- Messaging: RabbitMQ via MassTransit 8.5.8
- Realtime: SignalR
- Testing: xUnit + FluentAssertions 7.2.2 + Testcontainers (no mocks)

## Architecture Constraints
- All classes sealed by default
- Test-First Development
- Controllers only call Sender.Send()
- All handlers return Result<T>
- Permission checks in command handlers, not controllers
- Transaction table: append-only, no soft-delete
- UI inspired by FitNexus theme (dark sidebar, stat cards, charts)
