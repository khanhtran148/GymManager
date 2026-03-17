import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/local_db.dart' show LocalDb, SqliteLocalDb;
import 'models/offline_booking.dart';

/// Manages the queue of bookings that were created while the device was offline.
///
/// Bookings are persisted in SQLite so they survive app restarts. The queue
/// exposes a stream of the current pending-booking count so the UI can show
/// a badge or banner.
class OfflineBookingQueue {
  OfflineBookingQueue({LocalDb? db}) : _db = db ?? SqliteLocalDb.instance;

  final LocalDb _db;

  final _pendingCountController = StreamController<int>.broadcast();

  /// Emits the number of [SyncStatus.pending] bookings whenever it changes.
  Stream<int> get pendingCountStream => _pendingCountController.stream;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Persists [request] to the local SQLite database and bumps the pending
  /// count stream.
  ///
  /// [id] — caller-supplied UUID (e.g., from `const Uuid().v4()`).
  Future<void> enqueue(String id, BookingRequest request) async {
    final now = DateTime.now().toUtc().toIso8601String();

    final booking = OfflineBooking(
      id: id,
      timeSlotId: request.timeSlotId ?? '',
      bookingType: request.bookingType.toString(),
      payload: jsonEncode(request.toJson()),
      createdAt: now,
      syncStatus: SyncStatus.pending,
    );

    await _db.insert(booking);
    await _emitPendingCount();
  }

  /// Removes a successfully synced booking from the local database.
  Future<void> dequeue(String id) async {
    await _db.delete(id);
    await _emitPendingCount();
  }

  /// Returns the current number of pending (not-yet-synced) bookings.
  Future<int> getPendingCount() async {
    final rows = await _db.getPending();
    return rows.length;
  }

  /// Returns all pending bookings, ordered by [OfflineBooking.createdAt] asc.
  Future<List<OfflineBooking>> getAllPending() async {
    final rows = await _db.getPending();
    rows.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return rows;
  }

  /// Disposes internal stream resources.
  Future<void> dispose() async {
    await _pendingCountController.close();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  Future<void> _emitPendingCount() async {
    final count = await getPendingCount();
    if (!_pendingCountController.isClosed) {
      _pendingCountController.add(count);
    }
  }
}

// ---------------------------------------------------------------------------
// Riverpod provider
// ---------------------------------------------------------------------------

final offlineBookingQueueProvider = Provider<OfflineBookingQueue>((ref) {
  final queue = OfflineBookingQueue();
  ref.onDispose(queue.dispose);
  return queue;
});
