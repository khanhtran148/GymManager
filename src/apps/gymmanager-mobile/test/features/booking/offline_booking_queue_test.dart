// ignore_for_file: avoid_redundant_argument_values

import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gymmanager_mobile/core/database/local_db.dart';
import 'package:gymmanager_mobile/features/booking/data/models/offline_booking.dart';
import 'package:gymmanager_mobile/features/booking/data/offline_booking_queue.dart';

// ---------------------------------------------------------------------------
// Minimal in-memory LocalDb stub that avoids SQLite on CI.
// ---------------------------------------------------------------------------

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
  Future<void> delete(String id) async {
    _store.remove(id);
  }

  @override
  Future<List<OfflineBooking>> getAll() async => _store.values.toList();

  @override
  Future<List<OfflineBooking>> getPending() async => _store.values
      .where((b) => b.syncStatus == SyncStatus.pending)
      .toList();

  @override
  Future<void> close() async {}

  // Internal helper for tests
  OfflineBooking? get(String id) => _store[id];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _sampleGymHouseId = 'gym-house-001';
const _sampleMemberId = 'member-001';
const _sampleTimeSlotId = 'slot-001';

BookingRequest _makeRequest({
  String? timeSlotId,
  int bookingType = 0,
}) =>
    BookingRequest(
      gymHouseId: _sampleGymHouseId,
      memberId: _sampleMemberId,
      bookingType: bookingType,
      timeSlotId: timeSlotId ?? _sampleTimeSlotId,
    );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late _InMemoryDb db;
  late OfflineBookingQueue queue;

  setUp(() {
    db = _InMemoryDb();
    queue = OfflineBookingQueue(db: db);
  });

  tearDown(() async {
    await queue.dispose();
  });

  group('enqueue', () {
    test('persists booking in SQLite with pending status', () async {
      const id = 'booking-1';
      final request = _makeRequest();

      await queue.enqueue(id, request);

      final stored = db.get(id);
      expect(stored, isNotNull);
      expect(stored!.id, equals(id));
      expect(stored.syncStatus, equals(SyncStatus.pending));
      expect(stored.timeSlotId, equals(_sampleTimeSlotId));
    });

    test('payload encodes the full BookingRequest as JSON', () async {
      const id = 'booking-2';
      final request = _makeRequest(bookingType: 1);

      await queue.enqueue(id, request);

      final stored = db.get(id);
      final decoded = jsonDecode(stored!.payload) as Map<String, dynamic>;
      expect(decoded['memberId'], equals(_sampleMemberId));
      expect(decoded['bookingType'], equals(1));
    });

    test('emits updated pending count on each enqueue', () async {
      final counts = <int>[];
      final sub = queue.pendingCountStream.listen(counts.add);

      await queue.enqueue('b-1', _makeRequest());
      await queue.enqueue('b-2', _makeRequest(timeSlotId: 'slot-002'));

      await Future<void>.delayed(Duration.zero);
      await sub.cancel();

      expect(counts, containsAll([1, 2]));
    });
  });

  group('dequeue', () {
    test('removes booking from SQLite after successful sync', () async {
      const id = 'booking-3';
      await queue.enqueue(id, _makeRequest());

      await queue.dequeue(id);

      expect(db.get(id), isNull);
    });

    test('emits reduced pending count after dequeue', () async {
      await queue.enqueue('b-a', _makeRequest());
      await queue.enqueue('b-b', _makeRequest(timeSlotId: 'slot-002'));

      final counts = <int>[];
      final sub = queue.pendingCountStream.listen(counts.add);

      await queue.dequeue('b-a');
      await Future<void>.delayed(Duration.zero);
      await sub.cancel();

      expect(counts.last, equals(1));
    });
  });

  group('getPendingCount', () {
    test('returns zero when queue is empty', () async {
      expect(await queue.getPendingCount(), equals(0));
    });

    test('returns correct count for multiple pending bookings', () async {
      await queue.enqueue('c-1', _makeRequest());
      await queue.enqueue('c-2', _makeRequest(timeSlotId: 'slot-002'));
      await queue.enqueue('c-3', _makeRequest(timeSlotId: 'slot-003'));

      expect(await queue.getPendingCount(), equals(3));
    });

    test('does not count already-dequeued bookings', () async {
      await queue.enqueue('d-1', _makeRequest());
      await queue.enqueue('d-2', _makeRequest(timeSlotId: 'slot-002'));
      await queue.dequeue('d-1');

      expect(await queue.getPendingCount(), equals(1));
    });
  });

  group('getAllPending', () {
    test('returns bookings in createdAt ascending order', () async {
      // Insert in reverse order; the queue should return oldest first.
      await queue.enqueue('e-1', _makeRequest());
      await Future<void>.delayed(const Duration(milliseconds: 5));
      await queue.enqueue('e-2', _makeRequest(timeSlotId: 'slot-002'));

      final pending = await queue.getAllPending();
      expect(pending.length, equals(2));
      expect(
        pending.first.createdAt.compareTo(pending.last.createdAt),
        lessThanOrEqualTo(0),
      );
    });
  });
}
