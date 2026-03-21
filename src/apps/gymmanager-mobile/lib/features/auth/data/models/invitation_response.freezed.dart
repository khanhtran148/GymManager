// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'invitation_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not allowed to use it. The `sealed` modifier in the mixin enforces this.');

InvitationResponse _$InvitationResponseFromJson(Map<String, dynamic> json) {
  return _InvitationResponse.fromJson(json);
}

/// @nodoc
mixin _$InvitationResponse {
  String get id => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  String get gymHouseId => throw _privateConstructorUsedError;
  String get token => throw _privateConstructorUsedError;
  String get expiresAt => throw _privateConstructorUsedError;
  String get inviteUrl => throw _privateConstructorUsedError;

  /// Serializes this InvitationResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of InvitationResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $InvitationResponseCopyWith<InvitationResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InvitationResponseCopyWith<$Res> {
  factory $InvitationResponseCopyWith(
          InvitationResponse value, $Res Function(InvitationResponse) then) =
      _$InvitationResponseCopyWithImpl<$Res, InvitationResponse>;
  @useResult
  $Res call(
      {String id,
      String email,
      String role,
      String gymHouseId,
      String token,
      String expiresAt,
      String inviteUrl});
}

/// @nodoc
class _$InvitationResponseCopyWithImpl<$Res, $Val extends InvitationResponse>
    implements $InvitationResponseCopyWith<$Res> {
  _$InvitationResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of InvitationResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? role = null,
    Object? gymHouseId = null,
    Object? token = null,
    Object? expiresAt = null,
    Object? inviteUrl = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      gymHouseId: null == gymHouseId
          ? _value.gymHouseId
          : gymHouseId // ignore: cast_nullable_to_non_nullable
              as String,
      token: null == token
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: null == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as String,
      inviteUrl: null == inviteUrl
          ? _value.inviteUrl
          : inviteUrl // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InvitationResponseImplCopyWith<$Res>
    implements $InvitationResponseCopyWith<$Res> {
  factory _$$InvitationResponseImplCopyWith(_$InvitationResponseImpl value,
          $Res Function(_$InvitationResponseImpl) then) =
      __$$InvitationResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String email,
      String role,
      String gymHouseId,
      String token,
      String expiresAt,
      String inviteUrl});
}

/// @nodoc
class __$$InvitationResponseImplCopyWithImpl<$Res>
    extends _$InvitationResponseCopyWithImpl<$Res, _$InvitationResponseImpl>
    implements _$$InvitationResponseImplCopyWith<$Res> {
  __$$InvitationResponseImplCopyWithImpl(_$InvitationResponseImpl _value,
      $Res Function(_$InvitationResponseImpl) _then)
      : super(_value, _then);

  /// Create a copy of InvitationResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? role = null,
    Object? gymHouseId = null,
    Object? token = null,
    Object? expiresAt = null,
    Object? inviteUrl = null,
  }) {
    return _then(_$InvitationResponseImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      gymHouseId: null == gymHouseId
          ? _value.gymHouseId
          : gymHouseId // ignore: cast_nullable_to_non_nullable
              as String,
      token: null == token
          ? _value.token
          : token // ignore: cast_nullable_to_non_nullable
              as String,
      expiresAt: null == expiresAt
          ? _value.expiresAt
          : expiresAt // ignore: cast_nullable_to_non_nullable
              as String,
      inviteUrl: null == inviteUrl
          ? _value.inviteUrl
          : inviteUrl // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InvitationResponseImpl implements _InvitationResponse {
  const _$InvitationResponseImpl(
      {required this.id,
      required this.email,
      required this.role,
      required this.gymHouseId,
      required this.token,
      required this.expiresAt,
      required this.inviteUrl});

  factory _$InvitationResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$InvitationResponseImplFromJson(json);

  @override
  final String id;
  @override
  final String email;
  @override
  final String role;
  @override
  final String gymHouseId;
  @override
  final String token;
  @override
  final String expiresAt;
  @override
  final String inviteUrl;

  @override
  String toString() {
    return 'InvitationResponse(id: $id, email: $email, role: $role, gymHouseId: $gymHouseId, token: $token, expiresAt: $expiresAt, inviteUrl: $inviteUrl)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InvitationResponseImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.gymHouseId, gymHouseId) ||
                other.gymHouseId == gymHouseId) &&
            (identical(other.token, token) || other.token == token) &&
            (identical(other.expiresAt, expiresAt) ||
                other.expiresAt == expiresAt) &&
            (identical(other.inviteUrl, inviteUrl) ||
                other.inviteUrl == inviteUrl));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, email, role, gymHouseId, token, expiresAt, inviteUrl);

  /// Create a copy of InvitationResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InvitationResponseImplCopyWith<_$InvitationResponseImpl> get copyWith =>
      __$$InvitationResponseImplCopyWithImpl<_$InvitationResponseImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InvitationResponseImplToJson(
      this,
    );
  }
}

abstract class _InvitationResponse implements InvitationResponse {
  const factory _InvitationResponse(
      {required final String id,
      required final String email,
      required final String role,
      required final String gymHouseId,
      required final String token,
      required final String expiresAt,
      required final String inviteUrl}) = _$InvitationResponseImpl;

  factory _InvitationResponse.fromJson(Map<String, dynamic> json) =
      _$InvitationResponseImpl.fromJson;

  @override
  String get id;
  @override
  String get email;
  @override
  String get role;
  @override
  String get gymHouseId;
  @override
  String get token;
  @override
  String get expiresAt;
  @override
  String get inviteUrl;

  /// Create a copy of InvitationResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InvitationResponseImplCopyWith<_$InvitationResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
