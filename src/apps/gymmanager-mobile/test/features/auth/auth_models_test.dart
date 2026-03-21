import 'package:flutter_test/flutter_test.dart';
import 'package:gymmanager_mobile/features/auth/data/models/accept_invitation_request.dart';
import 'package:gymmanager_mobile/features/auth/data/models/auth_response.dart';
import 'package:gymmanager_mobile/features/auth/data/models/create_invitation_request.dart';
import 'package:gymmanager_mobile/features/auth/data/models/gym_house_public.dart';
import 'package:gymmanager_mobile/features/auth/data/models/invitation_response.dart';
import 'package:gymmanager_mobile/features/auth/data/models/register_request.dart';

void main() {
  // ---------------------------------------------------------------------------
  // GymHousePublic
  // ---------------------------------------------------------------------------
  group('GymHousePublic', () {
    const json = {
      'id': 'gym-uuid-1',
      'name': 'Iron Forge',
      'address': '123 Main St',
    };

    test('deserialises from JSON', () {
      final model = GymHousePublic.fromJson(json);

      expect(model.id, equals('gym-uuid-1'));
      expect(model.name, equals('Iron Forge'));
      expect(model.address, equals('123 Main St'));
    });

    test('serialises to JSON', () {
      const model = GymHousePublic(
        id: 'gym-uuid-1',
        name: 'Iron Forge',
        address: '123 Main St',
      );

      expect(model.toJson(), equals(json));
    });

    test('equality holds for identical instances', () {
      const a = GymHousePublic(id: 'x', name: 'Gym', address: 'Addr');
      const b = GymHousePublic(id: 'x', name: 'Gym', address: 'Addr');

      expect(a, equals(b));
    });
  });

  // ---------------------------------------------------------------------------
  // GymHousePublicList
  // ---------------------------------------------------------------------------
  group('GymHousePublicList', () {
    test('deserialises items array from JSON', () {
      final json = {
        'items': [
          {'id': 'g1', 'name': 'Gym A', 'address': 'Addr A'},
          {'id': 'g2', 'name': 'Gym B', 'address': 'Addr B'},
        ],
      };

      final list = GymHousePublicList.fromJson(json);

      expect(list.items.length, equals(2));
      expect(list.items[0].id, equals('g1'));
      expect(list.items[1].name, equals('Gym B'));
    });

    test('handles empty items array', () {
      final list = GymHousePublicList.fromJson({'items': []});

      expect(list.items, isEmpty);
    });
  });

  // ---------------------------------------------------------------------------
  // RegisterRequest
  // ---------------------------------------------------------------------------
  group('RegisterRequest', () {
    test('serialises all fields including gymHouseId', () {
      const request = RegisterRequest(
        email: 'alice@example.com',
        password: 'Test@1234',
        fullName: 'Alice Smith',
        phone: '+1-555-0100',
        gymHouseId: 'gym-uuid-1',
      );

      final json = request.toJson();

      expect(json['email'], equals('alice@example.com'));
      expect(json['password'], equals('Test@1234'));
      expect(json['fullName'], equals('Alice Smith'));
      expect(json['phone'], equals('+1-555-0100'));
      expect(json['gymHouseId'], equals('gym-uuid-1'));
    });

    test('serialises null phone as null', () {
      const request = RegisterRequest(
        email: 'bob@example.com',
        password: 'Test@1234',
        fullName: 'Bob',
        gymHouseId: 'gym-uuid-1',
      );

      expect(request.toJson()['phone'], isNull);
    });

    test('round-trips via JSON', () {
      const original = RegisterRequest(
        email: 'test@example.com',
        password: 'Test@1234',
        fullName: 'Test User',
        gymHouseId: 'gym-uuid-99',
      );

      final copy = RegisterRequest.fromJson(original.toJson());

      expect(copy, equals(original));
    });
  });

  // ---------------------------------------------------------------------------
  // AuthResponse
  // ---------------------------------------------------------------------------
  group('AuthResponse', () {
    const json = {
      'userId': 'user-uuid-1',
      'email': 'alice@example.com',
      'fullName': 'Alice Smith',
      'accessToken': 'jwt.access.token',
      'refreshToken': 'refresh-token-value',
      'expiresAt': '2026-03-22T00:00:00Z',
    };

    test('deserialises from JSON', () {
      final response = AuthResponse.fromJson(json);

      expect(response.userId, equals('user-uuid-1'));
      expect(response.email, equals('alice@example.com'));
      expect(response.accessToken, equals('jwt.access.token'));
      expect(response.refreshToken, equals('refresh-token-value'));
    });

    test('round-trips via JSON', () {
      final original = AuthResponse.fromJson(json);
      expect(AuthResponse.fromJson(original.toJson()), equals(original));
    });
  });

  // ---------------------------------------------------------------------------
  // AcceptInvitationRequest
  // ---------------------------------------------------------------------------
  group('AcceptInvitationRequest', () {
    test('serialises both required fields', () {
      const request = AcceptInvitationRequest(
        password: 'Test@1234',
        fullName: 'New User',
      );

      final json = request.toJson();

      expect(json['password'], equals('Test@1234'));
      expect(json['fullName'], equals('New User'));
    });

    test('round-trips via JSON', () {
      const original = AcceptInvitationRequest(
        password: 'Test@1234',
        fullName: 'Round Trip',
      );

      expect(AcceptInvitationRequest.fromJson(original.toJson()), equals(original));
    });
  });

  // ---------------------------------------------------------------------------
  // InvitationRole enum
  // ---------------------------------------------------------------------------
  group('InvitationRole', () {
    test('serialises to correct string values', () {
      const request = CreateInvitationRequest(
        email: 'test@example.com',
        role: InvitationRole.houseManager,
        gymHouseId: 'gym-1',
      );

      expect(request.toJson()['role'], equals('HouseManager'));
    });

    test('each role has a non-empty display name', () {
      for (final role in InvitationRole.values) {
        expect(role.displayName, isNotEmpty);
      }
    });

    test('display names match expected labels', () {
      expect(InvitationRole.houseManager.displayName, equals('House Manager'));
      expect(InvitationRole.trainer.displayName, equals('Trainer'));
      expect(InvitationRole.staff.displayName, equals('Staff'));
      expect(InvitationRole.member.displayName, equals('Member'));
    });
  });

  // ---------------------------------------------------------------------------
  // CreateInvitationRequest
  // ---------------------------------------------------------------------------
  group('CreateInvitationRequest', () {
    test('serialises all roles correctly', () {
      final cases = {
        InvitationRole.houseManager: 'HouseManager',
        InvitationRole.trainer: 'Trainer',
        InvitationRole.staff: 'Staff',
        InvitationRole.member: 'Member',
      };

      for (final entry in cases.entries) {
        final request = CreateInvitationRequest(
          email: 'x@x.com',
          role: entry.key,
          gymHouseId: 'g',
        );
        expect(
          request.toJson()['role'],
          equals(entry.value),
          reason: '${entry.key} should serialise as ${entry.value}',
        );
      }
    });

    test('round-trips via JSON', () {
      const original = CreateInvitationRequest(
        email: 'owner@gym.com',
        role: InvitationRole.trainer,
        gymHouseId: 'gym-uuid-2',
      );

      expect(
        CreateInvitationRequest.fromJson(original.toJson()),
        equals(original),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // InvitationResponse
  // ---------------------------------------------------------------------------
  group('InvitationResponse', () {
    const json = {
      'id': 'inv-uuid-1',
      'email': 'invited@example.com',
      'role': 'Trainer',
      'gymHouseId': 'gym-uuid-1',
      'token': 'base64-url-safe-token',
      'expiresAt': '2026-03-28T00:00:00Z',
      'inviteUrl': 'https://app.gymmanager.com/invite/base64-url-safe-token',
    };

    test('deserialises from JSON', () {
      final response = InvitationResponse.fromJson(json);

      expect(response.id, equals('inv-uuid-1'));
      expect(response.email, equals('invited@example.com'));
      expect(response.role, equals('Trainer'));
      expect(response.inviteUrl, contains('/invite/'));
    });

    test('round-trips via JSON', () {
      final original = InvitationResponse.fromJson(json);
      expect(InvitationResponse.fromJson(original.toJson()), equals(original));
    });
  });
}
