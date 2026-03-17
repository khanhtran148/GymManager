import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// High-level connectivity abstraction exposed to the rest of the app.
enum ConnectivityStatus { online, offline }

/// Wraps [Connectivity] and exposes a broadcast [Stream] of [ConnectivityStatus].
///
/// The monitor tracks the *previous* status so it can notify listeners when the
/// device transitions from offline → online (used by [BookingSyncService]).
class ConnectivityMonitor {
  ConnectivityMonitor({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  ConnectivityStatus _current = ConnectivityStatus.online;

  final _controller =
      StreamController<ConnectivityStatus>.broadcast();

  StreamSubscription<List<ConnectivityResult>>? _subscription;

  /// Called by consumers that want to be notified about online→offline
  /// transitions (e.g., [BookingSyncService]).
  final List<void Function()> _onlineCallbacks = [];

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Broadcast stream of connectivity status changes.
  Stream<ConnectivityStatus> get statusStream => _controller.stream;

  ConnectivityStatus get current => _current;

  /// Registers a callback invoked every time the device goes online.
  void onOnline(void Function() callback) {
    _onlineCallbacks.add(callback);
  }

  /// Removes a previously registered online callback.
  void removeOnlineCallback(void Function() callback) {
    _onlineCallbacks.remove(callback);
  }

  /// Starts listening to platform connectivity events.
  ///
  /// Safe to call multiple times — subsequent calls are no-ops.
  Future<void> start() async {
    if (_subscription != null) return;

    // Seed with the current connectivity status so the first event is accurate.
    final initial = await _connectivity.checkConnectivity();
    _current = _toStatus(initial);
    _controller.add(_current);

    _subscription = _connectivity.onConnectivityChanged.listen(_onResults);
  }

  /// Stops listening and closes the stream.
  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
    await _controller.close();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  void _onResults(List<ConnectivityResult> results) {
    final previous = _current;
    _current = _toStatus(results);
    _controller.add(_current);

    if (previous == ConnectivityStatus.offline &&
        _current == ConnectivityStatus.online) {
      for (final cb in List.of(_onlineCallbacks)) {
        cb();
      }
    }
  }

  ConnectivityStatus _toStatus(List<ConnectivityResult> results) {
    if (results.isEmpty) return ConnectivityStatus.offline;
    return results.any((r) => r != ConnectivityResult.none)
        ? ConnectivityStatus.online
        : ConnectivityStatus.offline;
  }
}

// ---------------------------------------------------------------------------
// Riverpod providers
// ---------------------------------------------------------------------------

/// Singleton [ConnectivityMonitor] provider.
///
/// Consumers must call [ConnectivityMonitor.start] before relying on the
/// stream. The canonical place to do this is in [main] via [ProviderScope].
final connectivityMonitorProvider = Provider<ConnectivityMonitor>((ref) {
  final monitor = ConnectivityMonitor();
  ref.onDispose(monitor.dispose);
  return monitor;
});

/// Provides the current [ConnectivityStatus] as a reactive [AsyncValue].
final connectivityStatusProvider =
    StreamProvider<ConnectivityStatus>((ref) async* {
  final monitor = ref.watch(connectivityMonitorProvider);
  await monitor.start();
  yield monitor.current;
  yield* monitor.statusStream;
});
