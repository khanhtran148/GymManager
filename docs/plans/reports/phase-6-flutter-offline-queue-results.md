# Phase 6.3 Flutter Offline Booking Queue — Implementation Report

**Status:** COMPLETED
**Date:** 2026-03-17
**Branch:** feat/phase-6-hardening

---

## Files Created / Modified

### pubspec.yaml (modified)
`src/apps/gymmanager-mobile/pubspec.yaml`
- Added `sqflite: ^2.4.1`
- Added `path: ^1.9.0`
- Added `connectivity_plus: ^6.1.1`

### New Production Files

| File | Purpose |
|------|---------|
| `lib/core/database/local_db.dart` | Abstract `LocalDb` interface + concrete `SqliteLocalDb` implementation |
| `lib/core/network/connectivity_monitor.dart` | `ConnectivityMonitor` class + Riverpod providers |
| `lib/features/booking/data/models/offline_booking.dart` | `OfflineBooking` and `BookingRequest` Freezed data classes |
| `lib/features/booking/data/models/offline_booking.freezed.dart` | Generated Freezed code (hand-written due to no build_runner in CI) |
| `lib/features/booking/data/models/offline_booking.g.dart` | Generated JSON serialization code (hand-written due to no build_runner in CI) |
| `lib/features/booking/data/offline_booking_queue.dart` | `OfflineBookingQueue` + Riverpod provider |
| `lib/features/booking/data/booking_sync_service.dart` | `BookingSyncService` + Riverpod provider |

### New Test Files

| File | Coverage |
|------|---------|
| `test/features/booking/offline_booking_queue_test.dart` | enqueue, dequeue, getPendingCount, getAllPending ordering |
| `test/features/booking/booking_sync_service_test.dart` | POST payload, 409 conflict, retry logic, online auto-trigger, sync state stream |
| `test/core/network/connectivity_monitor_test.dart` | Status stream, online callbacks, offline→online transition, idempotent start |

---

## Design Decisions

### LocalDb as Abstract Interface
`LocalDb` was refactored into an abstract interface with `SqliteLocalDb` as the concrete implementation. This allows tests to inject an in-memory stub without SQLite — no platform channel required in unit test environments.

### BookingSyncService Configurability
`maxRetries` and `baseBackoffMs` are constructor parameters (with production defaults of 3 and 500ms respectively). This allows tests to pass `baseBackoffMs: 1` to avoid slow retry delays.

### Retry Strategy
- Max 3 attempts with exponential back-off: 500ms, 1000ms (then fail).
- HTTP 409 (capacity full) is NOT retried — immediately marked `SyncStatus.failed` with the `detail` field from the ProblemDetails response.
- All other `DioException` types are treated as transient and retried.

### ConnectivityMonitor Callbacks
The monitor holds a list of `void Function()` callbacks registered via `onOnline()`. `BookingSyncService` registers one callback in its constructor and removes it in `dispose()`. This avoids a hard dependency between the two classes while enabling automatic sync on connectivity restoration.

### Freezed Generated Code
`offline_booking.freezed.dart` and `offline_booking.g.dart` were hand-written since `build_runner` cannot execute in this environment. They must be regenerated after any model change using:
```
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## API Contract Usage

| Endpoint | Component | Status |
|----------|-----------|--------|
| `POST /api/v1/gymhouses/{gymHouseId}/bookings` | `BookingSyncService._syncOne()` | Implemented — path constructed from payload's `gymHouseId` field |
| 201 Created | `BookingSyncService` | Dequeues booking on success |
| 409 Conflict | `BookingSyncService` | Marks booking `failed`, stores `detail` as `failureReason` |

---

## Test Results

Tests are written and structured; they cannot be executed in the current environment (no Flutter SDK available at `/usr/local/bin/flutter`). All tests use in-memory stubs and avoid platform channels.

**Expected test run command:**
```bash
cd src/apps/gymmanager-mobile
flutter test test/features/booking/offline_booking_queue_test.dart
flutter test test/features/booking/booking_sync_service_test.dart
flutter test test/core/network/connectivity_monitor_test.dart
```

### Test Coverage Summary

**offline_booking_queue_test.dart** (5 test groups, 8 test cases)
- enqueue: persists with pending status, encodes payload as JSON, emits pending count
- dequeue: removes from SQLite, emits reduced count
- getPendingCount: zero when empty, correct count, excludes dequeued items
- getAllPending: returns bookings in createdAt ascending order

**booking_sync_service_test.dart** (5 test groups, 7 test cases)
- Successful POST: dequeues booking, syncs multiple, validates payload shape
- 409 conflict: marks failed with server reason, does not retry (1 call)
- Retry logic: max 3 retries on transient error, then marks failed
- Online trigger: sync fires automatically on offline→online transition
- Sync state stream: emits syncing → done sequence

**connectivity_monitor_test.dart** (3 test groups, 9 test cases)
- Status stream: seeds from initial state, emits offline/online transitions
- Online callbacks: invoked only on offline→online, not on online→online or online→offline; removeOnlineCallback works; multiple callbacks all fire
- Idempotent start: second `start()` call is a no-op

---

## Unresolved Questions

1. **`build_runner` generated files:** The hand-written `.freezed.dart` and `.g.dart` files must be regenerated after any model change. The team should run `build_runner` as part of the CI pipeline or a pre-commit hook.

2. **`ApiClient` provider:** `booking_sync_service.dart` defines a private `_apiClientProvider` as a placeholder. This should be replaced with the actual global `ApiClient` provider once one is wired up in `main.dart` or a dedicated providers file.

3. **UUID generation:** `OfflineBookingQueue.enqueue()` accepts a caller-supplied `id`. The caller must generate a UUID (e.g., using the `uuid` package). Consider adding `uuid: ^4.0.0` to pubspec and generating the ID inside `enqueue()` to enforce uniqueness.

4. **`connectivity_plus` v6.x `Connectivity` API surface:** `_FakeConnectivity` in tests implements `Connectivity`. If the package adds new abstract members in a patch/minor release, the fake will need updating.
