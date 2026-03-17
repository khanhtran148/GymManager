import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/database/local_db.dart' show LocalDb, SqliteLocalDb;
import '../../../core/network/connectivity_monitor.dart';
import 'models/offline_booking.dart';
import 'offline_booking_queue.dart';

/// Describes the current sync operation state.
enum SyncState { idle, syncing, done, error }

/// Syncs pending offline bookings to the backend when connectivity is restored.
///
/// On each sync cycle:
/// 1. All [SyncStatus.pending] bookings are retrieved from the queue.
/// 2. Each booking is POSTed to `POST /api/v1/gymhouses/{gymHouseId}/bookings`.
/// 3. On HTTP 201 → booking is dequeued.
/// 4. On HTTP 409 → booking is marked [SyncStatus.failed] with a reason.
/// 5. On transient errors → retried up to [_maxRetries] times with exponential
///    back-off; after exhausting retries the row is marked [SyncStatus.failed].
class BookingSyncService {
  BookingSyncService({
    required ApiClient apiClient,
    required OfflineBookingQueue queue,
    required ConnectivityMonitor connectivityMonitor,
    LocalDb? db,
    int maxRetries = 3,
    int baseBackoffMs = 500,
  })  : _apiClient = apiClient,
        _queue = queue,
        _connectivityMonitor = connectivityMonitor,
        _db = db ?? SqliteLocalDb.instance,
        _maxRetries = maxRetries,
        _baseBackoffMs = baseBackoffMs {
    _connectivityMonitor.onOnline(_onDeviceOnline);
  }

  final ApiClient _apiClient;
  final OfflineBookingQueue _queue;
  final ConnectivityMonitor _connectivityMonitor;
  final LocalDb _db;

  final int _maxRetries;
  final int _baseBackoffMs;

  final _syncStateController = StreamController<SyncState>.broadcast();

  /// Emits the current [SyncState] whenever a sync cycle starts, progresses,
  /// or finishes.
  Stream<SyncState> get syncStateStream => _syncStateController.stream;

  SyncState _syncState = SyncState.idle;
  SyncState get syncState => _syncState;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Manually trigger a full sync cycle (e.g. pull-to-refresh).
  Future<void> syncNow() async {
    await _sync();
  }

  /// Releases resources.
  Future<void> dispose() async {
    _connectivityMonitor.removeOnlineCallback(_onDeviceOnline);
    await _syncStateController.close();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  void _onDeviceOnline() {
    // Fire-and-forget; errors surface via the state stream.
    _sync().ignore();
  }

  Future<void> _sync() async {
    if (_syncState == SyncState.syncing) return; // guard against re-entrancy

    _emit(SyncState.syncing);

    try {
      final pending = await _queue.getAllPending();
      for (final booking in pending) {
        await _syncOne(booking);
      }
      _emit(SyncState.done);
    } catch (_) {
      _emit(SyncState.error);
    }
  }

  Future<void> _syncOne(OfflineBooking booking, {int attempt = 1}) async {
    // Mark as syncing in DB so the UI can reflect the in-flight state.
    await _db.updateStatus(booking.id, SyncStatus.syncing);

    final Map<String, dynamic> payload =
        jsonDecode(booking.payload) as Map<String, dynamic>;
    final gymHouseId = payload['gymHouseId'] as String? ?? '';

    try {
      await _apiClient.post<dynamic>(
        '/gymhouses/$gymHouseId/bookings',
        data: payload,
      );

      // Success — remove from local queue.
      await _queue.dequeue(booking.id);
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;

      if (statusCode == 409) {
        // Capacity full — mark as permanently failed, do not retry.
        final detail = _extractDetail(e.response?.data);
        await _db.updateStatus(
          booking.id,
          SyncStatus.failed,
          failureReason: detail ?? 'Capacity full',
        );
        return;
      }

      // Transient failure — retry with exponential back-off.
      if (attempt < _maxRetries) {
        final delay =
            Duration(milliseconds: _baseBackoffMs * (1 << (attempt - 1)));
        await Future<void>.delayed(delay);
        await _syncOne(booking, attempt: attempt + 1);
      } else {
        await _db.updateStatus(
          booking.id,
          SyncStatus.failed,
          failureReason: e.message ?? 'Sync failed after $_maxRetries attempts',
        );
      }
    }
  }

  String? _extractDetail(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      return responseData['detail'] as String?;
    }
    return null;
  }

  void _emit(SyncState state) {
    _syncState = state;
    if (!_syncStateController.isClosed) {
      _syncStateController.add(state);
    }
  }
}

// ---------------------------------------------------------------------------
// Riverpod provider
// ---------------------------------------------------------------------------

/// Provides the singleton [ApiClient].  Replace with the real provider if one
/// exists in [api_client.dart].
final _apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final bookingSyncServiceProvider = Provider<BookingSyncService>((ref) {
  final service = BookingSyncService(
    apiClient: ref.watch(_apiClientProvider),
    queue: ref.watch(offlineBookingQueueProvider),
    connectivityMonitor: ref.watch(connectivityMonitorProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});
