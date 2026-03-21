import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_response.freezed.dart';
part 'auth_response.g.dart';

/// Returned by `POST /api/v1/auth/register` and
/// `POST /api/v1/invitations/{token}/accept`.
@freezed
class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required String userId,
    required String email,
    required String fullName,
    required String accessToken,
    required String refreshToken,
    required String expiresAt,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
}
