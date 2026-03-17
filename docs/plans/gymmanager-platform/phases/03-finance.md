## Phase 3: Finance

### Objective

Deliver the append-only transaction ledger, revenue dashboards (MRR, churn, avg revenue/member), P&L report per house and aggregated, expense tracking, and membership fee auto-creation on subscription events.

### Dependencies

Phase 1 (Member, Subscription) + Phase 2 (Booking -- for future class-based revenue).

### 3.1 Domain Layer

#### Enums to Add

- `TransactionType.cs` -- `MembershipFee, SalaryPayment, Rent, Utilities, Equipment, Wages, Expense, Refund, Other`
- `TransactionDirection.cs` -- `Credit, Debit`
- `TransactionCategory.cs` -- `Revenue, OperatingExpense, CapitalExpense, Payroll, Refund`

#### Entities to Create

**9. Transaction** -- `src/core/GymManager.Domain/Entities/Transaction.cs`

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK |
| GymHouseId | Guid | FK, tenant-scoped |
| TransactionType | TransactionType | |
| Direction | TransactionDirection | Credit or Debit |
| Amount | decimal | always positive |
| Category | TransactionCategory | |
| Description | string | |
| TransactionDate | DateTime | |
| RelatedEntityId | Guid? | polymorphic FK |
| ReversesTransactionId | Guid? | FK to self, for corrections |
| ReversedByTransactionId | Guid? | back-pointer |
| ApprovedById | Guid? | FK to User |
| PaymentMethod | PaymentMethod? | enum: Cash, BankTransfer, Card, Online |
| ExternalReference | string? | for future payment gateway |

**CRITICAL:** Transaction does NOT use soft-delete. Override `AuditableEntity` behavior: EF configuration must NOT apply the `DeletedAt IS NULL` query filter. The `DeletedAt` property exists but is never set. No DELETE operation permitted in application code.

Domain method: `static Transaction CreateReversal(Transaction original, string reason)` -- creates a new transaction with opposite direction and `ReversesTransactionId` set.

#### Enums

- `PaymentMethod.cs` -- `Cash, BankTransfer, Card, Online`

#### Domain Events

- `TransactionRecordedEvent(Guid TransactionId, Guid GymHouseId, TransactionType Type, decimal Amount)`

### 3.2 Application Layer

#### Interfaces

- `ITransactionRepository.cs` -- `RecordAsync`, `GetByIdAsync`, `GetByGymHouseAsync(dateRange, paged)`, `GetByTypeAsync`, `GetRevenueAggregateAsync(houseId, dateRange)`, `GetExpenseAggregateAsync(houseId, dateRange)`

#### Feature Slices

Folder: `src/core/GymManager.Application/Transactions/`

| Slice | Type | Permission |
|-------|------|------------|
| `RecordTransaction/RecordTransactionCommand.cs` | Command | ManageFinance |
| `RecordTransaction/RecordTransactionCommandHandler.cs` | Handler | |
| `ReverseTransaction/ReverseTransactionCommand.cs` | Command | ManageFinance |
| `ReverseTransaction/ReverseTransactionCommandHandler.cs` | Handler | creates reversing entry |
| `GetTransactions/GetTransactionsQuery.cs` | Query (paged, filterable) | ViewFinance |
| `GetTransactions/GetTransactionsQueryHandler.cs` | Handler | |
| `Shared/TransactionDto.cs` | DTO | |

Folder: `src/core/GymManager.Application/Reports/`

| Slice | Type | Permission |
|-------|------|------------|
| `GetPnLReport/GetPnLReportQuery.cs` | Query | ViewReports |
| `GetPnLReport/GetPnLReportQueryHandler.cs` | Handler | GROUP BY category, direction |
| `GetRevenueMetrics/GetRevenueMetricsQuery.cs` | Query | ViewReports |
| `GetRevenueMetrics/GetRevenueMetricsQueryHandler.cs` | Handler | MRR, churn rate, avg rev/member |
| `GetPnLReport/PnLReportDto.cs` | DTO | income lines, expense lines, net |
| `GetRevenueMetrics/RevenueMetricsDto.cs` | DTO | mrr, churn, avgRevPerMember |

#### MassTransit Consumer

- `SubscriptionFeeConsumer.cs` -- on `SubscriptionCreatedEvent`: auto-record a MembershipFee transaction with Credit direction, amount from event

### 3.3 Infrastructure Layer

#### EF Configuration

- `TransactionConfiguration.cs`:
  - Do NOT apply `DeletedAt IS NULL` query filter (append-only)
  - DO apply `GymHouseId == tenantId` query filter
  - Index on (GymHouseId, TransactionDate)
  - Index on (GymHouseId, TransactionType)
  - Index on ReversesTransactionId
  - Amount as decimal(18,2)
  - Self-referencing FK for ReversesTransactionId

#### Migration

- `dotnet ef migrations add AddTransactionEntity`

### 3.4 API Layer

**TransactionsController** -- `Controllers/TransactionsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| POST | `/api/v1/transactions` | Default |
| GET | `/api/v1/transactions` | Default |
| POST | `/api/v1/transactions/{id}/reverse` | Strict |

**ReportsController** -- `Controllers/ReportsController.cs`

| Method | Route | Rate Limit |
|--------|-------|------------|
| GET | `/api/v1/reports/pnl?houseId=&from=&to=` | Default |
| GET | `/api/v1/reports/revenue-metrics?houseId=&from=&to=` | Default |

### 3.5 Web Frontend

#### Financial Dashboard

- `src/app/(dashboard)/finance/page.tsx` -- stat cards (MRR, total revenue, total expenses, net), charts (revenue over time line chart, expense breakdown pie chart)
- `src/components/charts/revenue-line-chart.tsx` -- recharts line chart
- `src/components/charts/expense-pie-chart.tsx` -- recharts pie chart

#### Transaction List

- `src/app/(dashboard)/finance/transactions/page.tsx` -- paginated table, filters (type, direction, date range), search
- `src/app/(dashboard)/finance/transactions/new/page.tsx` -- record expense form (category, amount, description)

#### P&L Report

- `src/app/(dashboard)/finance/pnl/page.tsx` -- date range picker, house selector (or all), income section, expense section, net profit/loss
- `src/components/pnl-table.tsx`

#### Sidebar Update

Add Finance section with sub-items: Dashboard, Transactions, P&L Report.

### 3.6 Tests

#### Domain Tests

- `Entities/TransactionTests.cs` -- creation with valid fields, CreateReversal produces correct opposite direction, amount always positive validation

#### Application Tests

- `Transactions/RecordTransactionCommandHandlerTests.cs` -- success, permission denied
- `Transactions/ReverseTransactionCommandHandlerTests.cs` -- success, already reversed returns conflict, reversing a reversal returns conflict
- `Reports/GetPnLReportQueryHandlerTests.cs` -- correct grouping, date range filtering, per-house and aggregated
- `Reports/GetRevenueMetricsQueryHandlerTests.cs` -- MRR calculation, churn rate with expired subs

#### Infrastructure Tests

- `Persistence/TransactionImmutabilityTests.cs` -- verify no soft-delete filter applied (deleted transaction still visible in query)
- `Persistence/TransactionTenantIsolationTests.cs` -- house A transactions not visible from house B

#### MassTransit Consumer Tests

- `Consumers/SubscriptionFeeConsumerTests.cs` -- SubscriptionCreatedEvent produces correct Transaction record

#### Test Builders

- `Builders/TransactionBuilder.cs`

### 3.7 Acceptance Criteria

- [ ] Transactions are append-only (no update, no soft-delete filter)
- [ ] Reversing entry created correctly with opposite direction
- [ ] SubscriptionCreatedEvent auto-creates MembershipFee transaction
- [ ] P&L report returns correct income/expense/net grouped by category
- [ ] Revenue metrics: MRR, churn rate, avg revenue per member calculated correctly
- [ ] Transaction in house A not visible from house B
- [ ] Web: financial dashboard with charts, transaction CRUD, P&L report page

