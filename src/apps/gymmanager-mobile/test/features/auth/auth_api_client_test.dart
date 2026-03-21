import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gymmanager_mobile/core/api/api_client.dart';
import 'package:gymmanager_mobile/features/auth/data/models/accept_invitation_request.dart';
import 'package:gymmanager_mobile/features/auth/data/models/auth_response.dart';
import 'package:gymmanager_mobile/features/auth/data/models/create_invitation_request.dart';
import 'package:gymmanager_mobile/features/auth/data/models/gym_house_public.dart';
import 'package:gymmanager_mobile/features/auth/data/models/invitation_response.dart';
import 'package:gymmanager_mobile/features/auth/data/models/register_request.dart';

// ---------------------------------------------------------------------------
// Stub ApiClient
// ---------------------------------------------------------------------------

/// Subclass of [ApiClient] that bypasses real network I/O.
///
/// Stubs are registered by method + path fragment.  Only [get] and [post] are
/// overridden because those are the only HTTP methods used by the auth feature.
class _StubApiClient extends ApiClient {
  _StubApiClient() : super(storage: null);

  final _getStubs = <String, dynamic>{};
  final _postStubs = <String, _PostStub>{};

  void stubGet(String pathFragment, dynamic body) =>
      _getStubs[pathFragment] = body;

  void stubPost(String pathFragment, {int statusCode = 200, dynamic body}) =>
      _postStubs[pathFragment] = _PostStub(statusCode, body);

  @override
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    final entry = _getStubs.entries.firstWhere(
      (e) => path.contains(e.key),
      orElse: () => MapEntry('', null),
    );
    return fromJson != null ? fromJson(entry.value) : entry.value as T;
  }

  @override
  Future<T> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    final stub = _postStubs.entries.firstWhere(
      (e) => path.contains(e.key),
      orElse: () => MapEntry('', _PostStub(200, null)),
    ).value;

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
    return fromJson != null ? fromJson(stub.body) : stub.body as T;
  }
}

class _PostStub {
  _PostStub(this.statusCode, this.body);
  final int statusCode;
  final dynamic body;
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

Map<String, dynamic> _authResponseJson({
  String userId = 'user-1',
  String email = 'alice@example.com',
}) =>
    {
      'userId': userId,
      'email': email,
      'fullName': 'Alice Smith',
      'accessToken': 'jwt.access',
      'refreshToken': 'refresh',
      'expiresAt': '2026-04-01T00:00:00Z',
    };

Map<String, dynamic> _gymHouseListJson() => {
      'items': [
        {'id': 'gym-1', 'name': 'Iron Forge', 'address': '1 Main St'},
        {'id': 'gym-2', 'name': 'Flex Zone', 'address': '2 Park Ave'},
      ],
    };

Map<String, dynamic> _invitationResponseJson() => {
      'id': 'inv-1',
      'email': 'invited@example.com',
      'role': 'Trainer',
      'gymHouseId': 'gym-1',
      'token': 'secure-token-abc',
      'expiresAt': '2026-04-07T00:00:00Z',
      'inviteUrl': 'https://app.gymmanager.com/invite/secure-token-abc',
    };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late _StubApiClient client;

  setUp(() => client = _StubApiClient());

  // -------------------------------------------------------------------------
  // register()
  // -------------------------------------------------------------------------
  group('ApiClient.register()', () {
    test('posts to /auth/register and returns AuthResponse', () async {
      client.stubPost('/auth/register', body: _authResponseJson());

      final response = await client.register(
        const RegisterRequest(
          email: 'alice@example.com',
          password: 'Test@1234',
          fullName: 'Alice Smith',
          gymHouseId: 'gym-1',
        ),
      );

      expect(response, isA<AuthResponse>());
      expect(response.userId, equals('user-1'));
      expect(response.email, equals('alice@example.com'));
    });

    test('propagates DioException on 409 conflict', () async {
      client.stubPost('/auth/register', statusCode: 409, body: {
        'detail': 'Email already registered',
      });

      expect(
        () => client.register(
          const RegisterRequest(
            email: 'dup@example.com',
            password: 'Test@1234',
            fullName: 'Dup User',
            gymHouseId: 'gym-1',
          ),
        ),
        throwsA(isA<DioException>()),
      );
    });
  });

  // -------------------------------------------------------------------------
  // getPublicGymHouses()
  // -------------------------------------------------------------------------
  group('ApiClient.getPublicGymHouses()', () {
    test('gets /gym-houses/public and returns list of GymHousePublic', () async {
      client.stubGet('/gym-houses/public', _gymHouseListJson());

      final houses = await client.getPublicGymHouses();

      expect(houses.length, equals(2));
      expect(houses[0].id, equals('gym-1'));
      expect(houses[0].name, equals('Iron Forge'));
      expect(houses[1].id, equals('gym-2'));
    });

    test('returns empty list when items array is empty', () async {
      client.stubGet('/gym-houses/public', {'items': []});

      final houses = await client.getPublicGymHouses();

      expect(houses, isEmpty);
    });
  });

  // -------------------------------------------------------------------------
  // createInvitation()
  // -------------------------------------------------------------------------
  group('ApiClient.createInvitation()', () {
    test('posts to /invitations and returns InvitationResponse', () async {
      client.stubPost('/invitations', statusCode: 201, body: _invitationResponseJson());

      final response = await client.createInvitation(
        const CreateInvitationRequest(
          email: 'invited@example.com',
          role: InvitationRole.trainer,
          gymHouseId: 'gym-1',
        ),
      );

      expect(response, isA<InvitationResponse>());
      expect(response.token, equals('secure-token-abc'));
      expect(response.inviteUrl, contains('secure-token-abc'));
    });

    test('propagates DioException on 403 forbidden', () async {
      client.stubPost('/invitations', statusCode: 403);

      expect(
        () => client.createInvitation(
          const CreateInvitationRequest(
            email: 'x@x.com',
            role: InvitationRole.member,
            gymHouseId: 'gym-1',
          ),
        ),
        throwsA(isA<DioException>()),
      );
    });
  });

  // -------------------------------------------------------------------------
  // acceptInvitation()
  // -------------------------------------------------------------------------
  group('ApiClient.acceptInvitation()', () {
    test('posts to /invitations/{token}/accept and returns AuthResponse',
        () async {
      client.stubPost('/accept', body: _authResponseJson(userId: 'new-user-1'));

      final response = await client.acceptInvitation(
        'secure-token-abc',
        const AcceptInvitationRequest(
          fullName: 'New User',
          password: 'Test@1234',
        ),
      );

      expect(response, isA<AuthResponse>());
      expect(response.userId, equals('new-user-1'));
    });

    test('propagates DioException on 400 expired token', () async {
      client.stubPost('/accept', statusCode: 400, body: {
        'detail': 'Token has expired',
      });

      expect(
        () => client.acceptInvitation(
          'expired-token',
          const AcceptInvitationRequest(
            fullName: 'Test',
            password: 'Test@1234',
          ),
        ),
        throwsA(isA<DioException>()),
      );
    });

    test('propagates DioException on 404 token not found', () async {
      client.stubPost('/accept', statusCode: 404);

      expect(
        () => client.acceptInvitation(
          'unknown-token',
          const AcceptInvitationRequest(
            fullName: 'Ghost',
            password: 'Test@1234',
          ),
        ),
        throwsA(isA<DioException>()),
      );
    });
  });
}
