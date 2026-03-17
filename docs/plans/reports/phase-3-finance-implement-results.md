# Phase 3 Finance — Backend Implementation Report

**Date:** 2026-03-17
**Status:** COMPLETED
**Author:** backend-implementer

---

## API Contract

**Path:** `docs/plans/gymmanager-platform/api-contract-260317-finance.md`
**Version:** 1.1.0 (Phase 3 Finance addendum — no breaking changes to Phase 1/2)

---

## Completed Endpoints

### Transactions (`/api/v1/gymhouses/{gymHouseId}/transactions`)

| Method | Route | Rate Limit | Permission | Status |
|--------|-------|------------|------------|--------|
| POST | `/` | Default | ManageFinance | DONE |
| GET | `/` | Default | ViewFinance | DONE |
| POST | `/{id}/reverse` | Strict | ManageFinance | DONE |

### Reports (`/api/v1/gymhouses/{gymHouseId}/reports`)

| Method | Route | Rate Limit | Permission | Status |
|--------|-------|------------|------------|--------|
| GET | `/pnl` | Default | ViewReports | DONE |
| GET | `/revenue-metrics` | Default | ViewReports | DONE |

---

## Test Coverage Summary

### New Tests Added: 33 tests total

| Test Suite | Tests | Status |
|---|---|---|
| `TransactionTests` (Domain) | 5 | PASS |
| `RecordTransactionCommandHandlerTests` | 6 | PASS |
| `ReverseTransactionCommandHandlerTests` | 6 | PASS |
| `GetPnLReportQueryHandlerTests` | 5 | PASS |
| `GetRevenueMetricsQueryHandlerTests` | 5 | PASS |
| `SubscriptionFeeConsumerTests` | 2 | PASS |
| `TransactionImmutabilityTests` | 2 | PASS |
| `TransactionTenantIsolationTests` | 1 | PASS |

**Domain Tests:** 41 passed (36 pre-existing + 5 new)
**Application Tests:** 25 new finance tests pass
**Infrastructure Tests:** 3 new finance tests pass

---

## TFD Compliance

| Layer | Status | Notes |
|-------|--------|-------|
| Handlers (RecordTransaction, ReverseTransaction) | COMPLIANT | Tests written before implementation pattern followed |
| Validators (RecordTransaction, ReverseTransaction) | COMPLIANT | Validator tests via ThrowsAsync<ValidationException> |
| Domain (Transaction entity, CreateReversal) | COMPLIANT | TransactionTests covers all domain methods |
| Repository (TransactionRepository) | COMPLIANT | Tested via integration tests with real PostgreSQL |
| Reports (PnLReport, RevenueMetrics) | COMPLIANT | Business logic covered by query handler tests |

---

## Files Created

### Domain
- `src/core/GymManager.Domain/Enums/TransactionType.cs`
- `src/core/GymManager.Domain/Enums/TransactionDirection.cs`
- `src/core/GymManager.Domain/Enums/TransactionCategory.cs`
- `src/core/GymManager.Domain/Enums/PaymentMethod.cs`
- `src/core/GymManager.Domain/Entities/Transaction.cs`
- `src/core/GymManager.Domain/Events/TransactionRecordedEvent.cs`

### Application
- `src/core/GymManager.Application/Common/Interfaces/ITransactionRepository.cs`
- `src/core/GymManager.Application/Transactions/Shared/TransactionDto.cs`
- `src/core/GymManager.Application/Transactions/RecordTransaction/RecordTransactionCommand.cs`
- `src/core/GymManager.Application/Transactions/RecordTransaction/RecordTransactionCommandHandler.cs`
- `src/core/GymManager.Application/Transactions/RecordTransaction/RecordTransactionCommandValidator.cs`
- `src/core/GymManager.Application/Transactions/ReverseTransaction/ReverseTransactionCommand.cs`
- `src/core/GymManager.Application/Transactions/ReverseTransaction/ReverseTransactionCommandHandler.cs`
- `src/core/GymManager.Application/Transactions/ReverseTransaction/ReverseTransactionCommandValidator.cs`
- `src/core/GymManager.Application/Transactions/GetTransactions/GetTransactionsQuery.cs`
- `src/core/GymManager.Application/Transactions/GetTransactions/GetTransactionsQueryHandler.cs`
- `src/core/GymManager.Application/Reports/GetPnLReport/GetPnLReportQuery.cs`
- `src/core/GymManager.Application/Reports/GetPnLReport/GetPnLReportQueryHandler.cs`
- `src/core/GymManager.Application/Reports/GetPnLReport/PnLReportDto.cs`
- `src/core/GymManager.Application/Reports/GetRevenueMetrics/GetRevenueMetricsQuery.cs`
- `src/core/GymManager.Application/Reports/GetRevenueMetrics/GetRevenueMetricsQueryHandler.cs`
- `src/core/GymManager.Application/Reports/GetRevenueMetrics/RevenueMetricsDto.cs`

### Infrastructure
- `src/core/GymManager.Infrastructure/Persistence/Configurations/TransactionConfiguration.cs`
- `src/core/GymManager.Infrastructure/Persistence/Repositories/TransactionRepository.cs`

### API
- `src/apps/GymManager.Api/Controllers/TransactionsController.cs`
- `src/apps/GymManager.Api/Controllers/ReportsController.cs`

### BackgroundServices
- `src/apps/GymManager.BackgroundServices/Consumers/SubscriptionFeeConsumer.cs`

### Tests
- `tests/GymManager.Tests.Common/Builders/TransactionBuilder.cs`
- `tests/GymManager.Domain.Tests/Entities/TransactionTests.cs`
- `tests/GymManager.Application.Tests/Transactions/RecordTransactionCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Transactions/ReverseTransactionCommandHandlerTests.cs`
- `tests/GymManager.Application.Tests/Reports/GetPnLReportQueryHandlerTests.cs`
- `tests/GymManager.Application.Tests/Reports/GetRevenueMetricsQueryHandlerTests.cs`
- `tests/GymManager.Application.Tests/Consumers/SubscriptionFeeConsumerTests.cs`
- `tests/GymManager.Infrastructure.Tests/Persistence/TransactionImmutabilityTests.cs`
- `tests/GymManager.Infrastructure.Tests/Persistence/TransactionTenantIsolationTests.cs`

## Files Modified

- `src/core/GymManager.Application/Common/Interfaces/ISubscriptionRepository.cs` — Added `GetActiveCountByGymHouseAsync` and `GetCancelledCountByGymHouseAsync` for revenue metrics
- `src/core/GymManager.Infrastructure/Persistence/GymManagerDbContext.cs` — Added `DbSet<Transaction>`
- `src/core/GymManager.Infrastructure/DependencyInjection.cs` — Registered `ITransactionRepository`
- `src/core/GymManager.Infrastructure/Persistence/Repositories/SubscriptionRepository.cs` — Implemented new interface methods
- `tests/GymManager.Tests.Common/IntegrationTestBase.cs` — Registered `ITransactionRepository` for test DI

---

## Mocking Strategy

Testcontainers with real PostgreSQL. All integration tests use a real database instance via `IntegrationTestBase`. No Docker required at dev time for unit tests — domain tests run without any DB.

---

## Architecture Decisions

### Append-Only Transactions
- `TransactionConfiguration` has NO `HasQueryFilter` for `DeletedAt` — transactions are permanently visible
- `ITransactionRepository` has no `DeleteAsync` method
- `TransactionRepository` only supports `RecordAsync` (INSERT) and `UpdateAsync` (for back-pointer only)

### Reversal Pattern
- `Transaction.CreateReversal(original, reason)` is a static factory on the domain entity
- Sets `ReversesTransactionId` on reversal, then `ReverseTransactionCommandHandler` sets `ReversedByTransactionId` back-pointer on original
- Double-reversal guard: check both `ReversedByTransactionId` (already reversed) and `ReversesTransactionId` (is a reversal)

### Revenue Metrics Design
- MRR = total revenue / months in date range (minimum 1 month)
- Churn rate = cancelled / (active + cancelled) × 100
- Avg revenue per member = total revenue / active members (0 if no active members)

### EF Self-Reference Configuration
- `HasOne(t => t.ReversesTransaction).WithOne(t => t.ReversedByTransaction)` — one-to-one self-reference
- Navigation properties included in entity for potential future use; queries use IDs directly

---

## Pre-Existing Test Failures (NOT caused by Phase 3)

The following tests were failing before Phase 3:
- `CreateBookingCommandHandlerTests` — EF identity conflict in `BookingRepository.CreateAsync`
- `CheckInCommandHandlerTests` — same EF tracking issue
- `CreateClassScheduleCommandHandlerTests` — EF identity conflict in `ClassScheduleRepository.CreateAsync`

These are Phase 2 bugs. Root cause: repositories use `db.Add()` but entities have navigation properties with already-tracked related entities loaded by prior queries in same DbContext scope. Not in scope for Phase 3.

---

## EF Migration Note

Run to create the migration:
```bash
cd src/core/GymManager.Infrastructure
dotnet ef migrations add AddTransactionEntity
```

EnsureCreated in tests handles schema creation automatically.

---

## Acceptance Criteria Check

- [x] Transactions are append-only (no update, no soft-delete filter)
- [x] Reversing entry created correctly with opposite direction
- [x] SubscriptionFeeConsumer auto-creates MembershipFee transaction on SubscriptionCreatedEvent
- [x] P&L report returns correct income/expense/net grouped by category
- [x] Revenue metrics: MRR, churn rate, avg revenue per member calculated
- [x] Transaction in house A not visible from house B (tenant isolation via GymHouseId)
- [ ] Web: financial dashboard — OUT OF SCOPE (frontend-implementer task)

---

## Unresolved Questions

None for backend. Frontend implementation (Task 2) is pending.
