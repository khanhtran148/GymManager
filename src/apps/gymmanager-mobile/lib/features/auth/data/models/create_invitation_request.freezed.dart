// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'create_invitation_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not allowed to use it. The `sealed` modifier in the mixin enforces this.');

CreateInvitationRequest _$CreateInvitationRequestFromJson(
    Map<String, dynamic> json) {
  return _CreateInvitationRequest.fromJson(json);
}

/// @nodoc
mixin _$CreateInvitationRequest {
  String get email => throw _privateConstructorUsedError;
  InvitationRole get role => throw _privateConstructorUsedError;
  String get gymHouseId => throw _privateConstructorUsedError;

  /// Serializes this CreateInvitationRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CreateInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CreateInvitationRequestCopyWith<CreateInvitationRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateInvitationRequestCopyWith<$Res> {
  factory $CreateInvitationRequestCopyWith(CreateInvitationRequest value,
          $Res Function(CreateInvitationRequest) then) =
      _$CreateInvitationRequestCopyWithImpl<$Res, CreateInvitationRequest>;
  @useResult
  $Res call({String email, InvitationRole role, String gymHouseId});
}

/// @nodoc
class _$CreateInvitationRequestCopyWithImpl<$Res,
        $Val extends CreateInvitationRequest>
    implements $CreateInvitationRequestCopyWith<$Res> {
  _$CreateInvitationRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CreateInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? email = null,
    Object? role = null,
    Object? gymHouseId = null,
  }) {
    return _then(_value.copyWith(
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as InvitationRole,
      gymHouseId: null == gymHouseId
          ? _value.gymHouseId
          : gymHouseId // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateInvitationRequestImplCopyWith<$Res>
    implements $CreateInvitationRequestCopyWith<$Res> {
  factory _$$CreateInvitationRequestImplCopyWith(
          _$CreateInvitationRequestImpl value,
          $Res Function(_$CreateInvitationRequestImpl) then) =
      __$$CreateInvitationRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String email, InvitationRole role, String gymHouseId});
}

/// @nodoc
class __$$CreateInvitationRequestImplCopyWithImpl<$Res>
    extends _$CreateInvitationRequestCopyWithImpl<$Res,
        _$CreateInvitationRequestImpl>
    implements _$$CreateInvitationRequestImplCopyWith<$Res> {
  __$$CreateInvitationRequestImplCopyWithImpl(
      _$CreateInvitationRequestImpl _value,
      $Res Function(_$CreateInvitationRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of CreateInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? email = null,
    Object? role = null,
    Object? gymHouseId = null,
  }) {
    return _then(_$CreateInvitationRequestImpl(
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as InvitationRole,
      gymHouseId: null == gymHouseId
          ? _value.gymHouseId
          : gymHouseId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateInvitationRequestImpl implements _CreateInvitationRequest {
  const _$CreateInvitationRequestImpl(
      {required this.email, required this.role, required this.gymHouseId});

  factory _$CreateInvitationRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateInvitationRequestImplFromJson(json);

  @override
  final String email;
  @override
  final InvitationRole role;
  @override
  final String gymHouseId;

  @override
  String toString() {
    return 'CreateInvitationRequest(email: $email, role: $role, gymHouseId: $gymHouseId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateInvitationRequestImpl &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.gymHouseId, gymHouseId) ||
                other.gymHouseId == gymHouseId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, email, role, gymHouseId);

  /// Create a copy of CreateInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateInvitationRequestImplCopyWith<_$CreateInvitationRequestImpl>
      get copyWith =>
          __$$CreateInvitationRequestImplCopyWithImpl<
              _$CreateInvitationRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateInvitationRequestImplToJson(
      this,
    );
  }
}

abstract class _CreateInvitationRequest implements CreateInvitationRequest {
  const factory _CreateInvitationRequest(
      {required final String email,
      required final InvitationRole role,
      required final String gymHouseId}) = _$CreateInvitationRequestImpl;

  factory _CreateInvitationRequest.fromJson(Map<String, dynamic> json) =
      _$CreateInvitationRequestImpl.fromJson;

  @override
  String get email;
  @override
  InvitationRole get role;
  @override
  String get gymHouseId;

  /// Create a copy of CreateInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CreateInvitationRequestImplCopyWith<_$CreateInvitationRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
