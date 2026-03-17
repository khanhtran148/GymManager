import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const _HomeScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const _LoginScreen(),
      ),
    ],
    redirect: (context, state) {
      // TODO: add auth guard
      return null;
    },
  );
});

class _HomeScreen extends StatelessWidget {
  const _HomeScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GymManager')),
      body: const Center(child: Text('Welcome to GymManager')),
    );
  }
}

class _LoginScreen extends StatelessWidget {
  const _LoginScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: const Center(child: Text('Login')),
    );
  }
}
