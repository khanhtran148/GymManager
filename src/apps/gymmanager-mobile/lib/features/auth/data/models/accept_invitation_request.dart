import 'package:freezed_annotation/freezed_annotation.dart';

part 'accept_invitation_request.freezed.dart';
part 'accept_invitation_request.g.dart';

/// Request body for `POST /api/v1/invitations/{token}/accept`.
///
/// Both fields are required when accepting as a new user.
/// When the invited email already has an account the backend uses the existing
/// credentials, but the mobile form always collects them for simplicity.
@freezed
class AcceptInvitationRequest with _$AcceptInvitationRequest {
  const factory AcceptInvitationRequest({
    required String password,
    required String fullName,
  }) = _AcceptInvitationRequest;

  factory AcceptInvitationRequest.fromJson(Map<String, dynamic> json) =>
      _$AcceptInvitationRequestFromJson(json);
}
