// ignore_for_file: avoid_redundant_argument_values

import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmanager_mobile/core/api/api_client.dart';
import 'package:gymmanager_mobile/core/database/local_db.dart';
import 'package:gymmanager_mobile/core/network/connectivity_monitor.dart';
import 'package:gymmanager_mobile/features/booking/data/booking_sync_service.dart';
import 'package:gymmanager_mobile/features/booking/data/models/offline_booking.dart';
import 'package:gymmanager_mobile/features/booking/data/offline_booking_queue.dart';

// ---------------------------------------------------------------------------
// Fakes / stubs
// ---------------------------------------------------------------------------

/// Simple in-memory LocalDb (same pattern as offline_booking_queue_test).
class _InMemoryDb implements LocalDb {
  final _store = <String, OfflineBooking>{};

  @override
  Future<void> init() async {}

  @override
  Future<void> insert(OfflineBooking booking) async {
    _store[booking.id] = booking;
  }

  @override
  Future<void> updateStatus(
    String id,
    SyncStatus status, {
    String? failureReason,
  }) async {
    final existing = _store[id];
    if (existing != null) {
      _store[id] = existing.copyWith(
        syncStatus: status,
        failureReason: failureReason,
      );
    }
  }

  @override
  Future<void> delete(String id) async => _store.remove(id);

  @override
  Future<List<OfflineBooking>> getAll() async => _store.values.toList();

  @override
  Future<List<OfflineBooking>> getPending() async => _store.values
      .where((b) => b.syncStatus == SyncStatus.pending)
      .toList();

  @override
  Future<void> close() async {}

  OfflineBooking? get(String id) => _store[id];
}

/// Stub [ApiClient] that lets tests configure per-call responses.
class _StubApiClient extends ApiClient {
  _StubApiClient() : super(storage: null);

  final _responses = <String, _StubResponse>{};

  void stubPost(String pathFragment, {int statusCode = 201, dynamic body}) {
    _responses[pathFragment] = _StubResponse(statusCode, body);
  }

  @override
  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    final stub = _responses.entries
        .firstWhere(
          (e) => path.contains(e.key),
          orElse: () => MapEntry('', _StubResponse(201, null)),
        )
        .value;

    if (stub.statusCode >= 400) {
      throw DioException(
        requestOptions: RequestOptions(path: path),
        response: Response<dynamic>(
          requestOptions: RequestOptions(path: path),
          statusCode: stub.statusCode,
          data: stub.body,
        ),
        type: DioExceptionType.badResponse,
      );
    }
    return (fromJson != null ? fromJson(stub.body) : stub.body) as T;
  }
}

class _StubResponse {
  _StubResponse(this.statusCode, this.body);
  final int statusCode;
  final dynamic body;
}

/// Stub connectivity monitor that allows tests to simulate online events.
class _StubConnectivityMonitor extends ConnectivityMonitor {
  final _callbacks = <void Function()>[];

  @override
  void onOnline(void Function() callback) => _callbacks.add(callback);

  @override
  void removeOnlineCallback(void Function() callback) =>
      _callbacks.remove(callback);

  void triggerOnline() {
    for (final cb in List.of(_callbacks)) {
      cb();
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _gymHouseId = 'gym-001';
const _memberId = 'member-001';
const _timeSlotId = 'slot-001';

Future<void> _enqueue(
  OfflineBookingQueue queue,
  String id, {
  String? gymHouseId,
  String? timeSlotId,
}) async {
  await queue.enqueue(
    id,
    BookingRequest(
      gymHouseId: gymHouseId ?? _gymHouseId,
      memberId: _memberId,
      bookingType: 0,
      timeSlotId: timeSlotId ?? _timeSlotId,
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late _InMemoryDb db;
  late _StubApiClient apiClient;
  late _StubConnectivityMonitor connectivityMonitor;
  late OfflineBookingQueue queue;
  late BookingSyncService syncService;

  setUp(() {
    db = _InMemoryDb();
    apiClient = _StubApiClient();
    connectivityMonitor = _StubConnectivityMonitor();
    queue = OfflineBookingQueue(db: db);
    syncService = BookingSyncService(
      apiClient: apiClient,
      queue: queue,
      connectivityMonitor: connectivityMonitor,
      db: db,
    );
  });

  tearDown(() async {
    await syncService.dispose();
    await queue.dispose();
  });

  group('sync service — successful POST', () {
    test('POSTs pending booking to correct API path', () async {
      apiClient.stubPost('/gymhouses/$_gymHouseId/bookings', statusCode: 201);
      await _enqueue(queue, 'book-1');

      await syncService.syncNow();

      // After success the booking is dequeued (removed from db).
      expect(db.get('book-1'), isNull);
    });

    test('syncs multiple pending bookings in a single cycle', () async {
      apiClient.stubPost('/gymhouses/$_gymHouseId/bookings', statusCode: 201);
      await _enqueue(queue, 'multi-1');
      await _enqueue(queue, 'multi-2');

      await syncService.syncNow();

      expect(db.get('multi-1'), isNull);
      expect(db.get('multi-2'), isNull);
    });

    test('POST payload matches original BookingRequest', () async {
      Map<String, dynamic>? capturedData;
      // Override post to capture payload.
      apiClient.stubPost('/gymhouses/$_gymHouseId/bookings', statusCode: 201);

      await queue.enqueue(
        'payload-check',
        const BookingRequest(
          gymHouseId: _gymHouseId,
          memberId: _memberId,
          bookingType: 1,
          timeSlotId: _timeSlotId,
        ),
      );

      // Intercept via custom stub.
      final captureClient = _CapturingApiClient(capturedData: (d) {
        capturedData = d as Map<String, dynamic>;
      });
      final captureQueue = OfflineBookingQueue(db: db);
      final captureService = BookingSyncService(
        apiClient: captureClient,
        queue: captureQueue,
        connectivityMonitor: connectivityMonitor,
        db: db,
      );

      await captureService.syncNow();
      await captureService.dispose();
      await captureQueue.dispose();

      expect(capturedData?['memberId'], equals(_memberId));
      expect(capturedData?['bookingType'], equals(1));
    });
  });

  group('sync service — 409 conflict handling', () {
    test('marks booking as failed with reason when server returns 409',
        () async {
      apiClient.stubPost(
        '/gymhouses/$_gymHouseId/bookings',
        statusCode: 409,
        body: {'detail': 'Class is fully booked'},
      );
      await _enqueue(queue, 'conflict-1');

      await syncService.syncNow();

      final stored = db.get('conflict-1');
      expect(stored, isNotNull);
      expect(stored!.syncStatus, equals(SyncStatus.failed));
      expect(stored.failureReason, equals('Class is fully booked'));
    });

    test('does not retry on 409', () async {
      var callCount = 0;
      // Re-create a client that counts calls.
      final countingClient = _CountingApiClient(
        onPost: (_) {
          callCount++;
          throw DioException(
            requestOptions: RequestOptions(path: '/test'),
            response: Response<dynamic>(
              requestOptions: RequestOptions(path: '/test'),
              statusCode: 409,
              data: {'detail': 'Capacity full'},
            ),
            type: DioExceptionType.badResponse,
          );
        },
      );
      final countingQueue = OfflineBookingQueue(db: db);
      final countingService = BookingSyncService(
        apiClient: countingClient,
        queue: countingQueue,
        connectivityMonitor: connectivityMonitor,
        db: db,
        baseBackoffMs: 1,
      );
      await _enqueue(countingQueue, 'no-retry-1');

      await countingService.syncNow();
      await countingService.dispose();
      await countingQueue.dispose();

      expect(callCount, equals(1));
    });
  });

  group('sync service — retry logic', () {
    test('retries up to maxRetries on transient failure then marks failed',
        () async {
      var callCount = 0;
      final retryClient = _CountingApiClient(
        onPost: (_) {
          callCount++;
          throw DioException(
            requestOptions: RequestOptions(path: '/test'),
            type: DioExceptionType.connectionTimeout,
            message: 'timeout',
          );
        },
      );
      final retryDb = _InMemoryDb();
      final retryQueue = OfflineBookingQueue(db: retryDb);
      final retryService = BookingSyncService(
        apiClient: retryClient,
        queue: retryQueue,
        connectivityMonitor: connectivityMonitor,
        db: retryDb,
        baseBackoffMs: 1, // speed up test
      );
      await _enqueue(retryQueue, 'retry-1');

      await retryService.syncNow();
      await retryService.dispose();
      await retryQueue.dispose();

      expect(callCount, equals(3)); // max 3 attempts
      final stored = retryDb.get('retry-1');
      expect(stored?.syncStatus, equals(SyncStatus.failed));
    });
  });

  group('sync service — online trigger', () {
    test('sync is triggered automatically when device comes online', () async {
      apiClient.stubPost('/gymhouses/$_gymHouseId/bookings', statusCode: 201);
      await _enqueue(queue, 'auto-sync-1');

      connectivityMonitor.triggerOnline();
      // Allow the async fire-and-forget to complete.
      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(db.get('auto-sync-1'), isNull);
    });
  });

  group('sync state stream', () {
    test('emits syncing then done on successful sync', () async {
      apiClient.stubPost('/gymhouses/$_gymHouseId/bookings', statusCode: 201);
      await _enqueue(queue, 'state-1');

      final states = <SyncState>[];
      final sub = syncService.syncStateStream.listen(states.add);

      await syncService.syncNow();
      await sub.cancel();

      expect(states, containsAllInOrder([SyncState.syncing, SyncState.done]));
    });
  });
}

// ---------------------------------------------------------------------------
// Additional client helpers used in tests above
// ---------------------------------------------------------------------------

class _CapturingApiClient extends ApiClient {
  _CapturingApiClient({required this.capturedData}) : super(storage: null);

  final void Function(dynamic) capturedData;

  @override
  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    capturedData(data);
    return null as T;
  }
}

class _CountingApiClient extends ApiClient {
  _CountingApiClient({required this.onPost}) : super(storage: null);

  final void Function(dynamic) onPost;

  @override
  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    onPost(data);
    return null as T; // will never be reached when onPost throws
  }
}
