// ignore_for_file: avoid_redundant_argument_values

import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmanager_mobile/core/network/connectivity_monitor.dart';

// ---------------------------------------------------------------------------
// Fake Connectivity
// ---------------------------------------------------------------------------

/// A fake [Connectivity] implementation driven by a [StreamController].
class _FakeConnectivity implements Connectivity {
  final _controller =
      StreamController<List<ConnectivityResult>>.broadcast();

  List<ConnectivityResult> _current = [ConnectivityResult.wifi];

  void emit(List<ConnectivityResult> results) {
    _current = results;
    _controller.add(results);
  }

  @override
  Future<List<ConnectivityResult>> checkConnectivity() async => _current;

  @override
  Stream<List<ConnectivityResult>> get onConnectivityChanged =>
      _controller.stream;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late _FakeConnectivity fakeConnectivity;
  late ConnectivityMonitor monitor;

  setUp(() {
    fakeConnectivity = _FakeConnectivity();
    monitor = ConnectivityMonitor(connectivity: fakeConnectivity);
  });

  tearDown(() async {
    await monitor.dispose();
  });

  group('ConnectivityMonitor — status stream', () {
    test('emits online when initial connectivity is wifi', () async {
      fakeConnectivity._current = [ConnectivityResult.wifi];

      await monitor.start();
      // The seed event is synchronously added; read current directly.
      expect(monitor.current, equals(ConnectivityStatus.online));
    });

    test('emits offline when initial connectivity is none', () async {
      fakeConnectivity._current = [ConnectivityResult.none];

      await monitor.start();
      expect(monitor.current, equals(ConnectivityStatus.offline));
    });

    test('emits ConnectivityStatus.offline when connectivity drops', () async {
      await monitor.start();

      final emitted = <ConnectivityStatus>[];
      final sub = monitor.statusStream.listen(emitted.add);

      fakeConnectivity.emit([ConnectivityResult.none]);
      await Future<void>.delayed(Duration.zero);

      await sub.cancel();
      expect(emitted, contains(ConnectivityStatus.offline));
    });

    test('emits ConnectivityStatus.online when connectivity restores',
        () async {
      fakeConnectivity._current = [ConnectivityResult.none];
      await monitor.start();

      final emitted = <ConnectivityStatus>[];
      final sub = monitor.statusStream.listen(emitted.add);

      fakeConnectivity.emit([ConnectivityResult.mobile]);
      await Future<void>.delayed(Duration.zero);

      await sub.cancel();
      expect(emitted, contains(ConnectivityStatus.online));
    });

    test('multiple results — online if any non-none present', () async {
      await monitor.start();

      final emitted = <ConnectivityStatus>[];
      final sub = monitor.statusStream.listen(emitted.add);

      fakeConnectivity
          .emit([ConnectivityResult.none, ConnectivityResult.wifi]);
      await Future<void>.delayed(Duration.zero);

      await sub.cancel();
      expect(emitted.last, equals(ConnectivityStatus.online));
    });
  });

  group('ConnectivityMonitor — online callbacks', () {
    test('onOnline callback is invoked on offline→online transition', () async {
      // Start offline.
      fakeConnectivity._current = [ConnectivityResult.none];
      await monitor.start();

      var callbackCount = 0;
      monitor.onOnline(() => callbackCount++);

      // Go online.
      fakeConnectivity.emit([ConnectivityResult.wifi]);
      await Future<void>.delayed(Duration.zero);

      expect(callbackCount, equals(1));
    });

    test('onOnline callback NOT invoked when already online', () async {
      fakeConnectivity._current = [ConnectivityResult.wifi];
      await monitor.start();

      var callbackCount = 0;
      monitor.onOnline(() => callbackCount++);

      // Another online event — no transition.
      fakeConnectivity.emit([ConnectivityResult.mobile]);
      await Future<void>.delayed(Duration.zero);

      expect(callbackCount, equals(0));
    });

    test('onOnline callback NOT invoked on online→offline transition', () async {
      fakeConnectivity._current = [ConnectivityResult.wifi];
      await monitor.start();

      var callbackCount = 0;
      monitor.onOnline(() => callbackCount++);

      fakeConnectivity.emit([ConnectivityResult.none]);
      await Future<void>.delayed(Duration.zero);

      expect(callbackCount, equals(0));
    });

    test('removeOnlineCallback stops future notifications', () async {
      fakeConnectivity._current = [ConnectivityResult.none];
      await monitor.start();

      var callbackCount = 0;
      void callback() => callbackCount++;

      monitor.onOnline(callback);
      monitor.removeOnlineCallback(callback);

      fakeConnectivity.emit([ConnectivityResult.wifi]);
      await Future<void>.delayed(Duration.zero);

      expect(callbackCount, equals(0));
    });

    test('multiple callbacks are all invoked on transition', () async {
      fakeConnectivity._current = [ConnectivityResult.none];
      await monitor.start();

      final invocations = <int>[];
      monitor.onOnline(() => invocations.add(1));
      monitor.onOnline(() => invocations.add(2));

      fakeConnectivity.emit([ConnectivityResult.wifi]);
      await Future<void>.delayed(Duration.zero);

      expect(invocations, containsAll([1, 2]));
    });
  });

  group('ConnectivityMonitor — idempotent start', () {
    test('calling start() twice does not duplicate subscriptions', () async {
      await monitor.start();
      await monitor.start(); // second call should be a no-op

      final emitted = <ConnectivityStatus>[];
      final sub = monitor.statusStream.listen(emitted.add);

      fakeConnectivity.emit([ConnectivityResult.none]);
      await Future<void>.delayed(Duration.zero);

      await sub.cancel();
      // Expect exactly one event, not two.
      expect(emitted.length, equals(1));
    });
  });
}
