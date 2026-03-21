import 'package:freezed_annotation/freezed_annotation.dart';

part 'invitation_response.freezed.dart';
part 'invitation_response.g.dart';

/// Response body from `POST /api/v1/invitations`.
@freezed
class InvitationResponse with _$InvitationResponse {
  const factory InvitationResponse({
    required String id,
    required String email,
    required String role,
    required String gymHouseId,
    required String token,
    required String expiresAt,
    required String inviteUrl,
  }) = _InvitationResponse;

  factory InvitationResponse.fromJson(Map<String, dynamic> json) =>
      _$InvitationResponseFromJson(json);
}
