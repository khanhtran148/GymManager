import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/create_invitation_screen.dart';
import '../../features/auth/presentation/invite_accept_screen.dart';
import '../../features/auth/presentation/register_screen.dart';

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
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      /// Deep-link route: `/invite/:token`
      ///
      /// Handles both in-app navigation and universal-link / app-link deep links
      /// where the host app is launched with a URL of the form
      /// `gymmanager://invite/<token>` or `https://app.gymmanager.com/invite/<token>`.
      GoRoute(
        path: '/invite/:token',
        builder: (context, state) {
          final token = state.pathParameters['token']!;
          return InviteAcceptScreen(token: token);
        },
      ),

      /// Owner/manager screen for sending invitations.
      GoRoute(
        path: '/invitations/new',
        builder: (context, state) => const CreateInvitationScreen(),
      ),
    ],
    redirect: (context, state) {
      // TODO: add auth guard — redirect unauthenticated users to /login
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
