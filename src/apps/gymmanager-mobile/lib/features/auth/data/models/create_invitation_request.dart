import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_invitation_request.freezed.dart';
part 'create_invitation_request.g.dart';

/// Roles that can be invited (Owner role is not allowed by the API).
enum InvitationRole {
  @JsonValue('HouseManager')
  houseManager,
  @JsonValue('Trainer')
  trainer,
  @JsonValue('Staff')
  staff,
  @JsonValue('Member')
  member;

  String get displayName => switch (this) {
        InvitationRole.houseManager => 'House Manager',
        InvitationRole.trainer => 'Trainer',
        InvitationRole.staff => 'Staff',
        InvitationRole.member => 'Member',
      };
}

/// Request body for `POST /api/v1/invitations`.
@freezed
class CreateInvitationRequest with _$CreateInvitationRequest {
  const factory CreateInvitationRequest({
    required String email,
    required InvitationRole role,
    required String gymHouseId,
  }) = _CreateInvitationRequest;

  factory CreateInvitationRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateInvitationRequestFromJson(json);
}
