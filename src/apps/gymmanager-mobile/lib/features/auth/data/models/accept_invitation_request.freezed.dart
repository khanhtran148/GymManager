// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'accept_invitation_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not allowed to use it. The `sealed` modifier in the mixin enforces this.');

AcceptInvitationRequest _$AcceptInvitationRequestFromJson(
    Map<String, dynamic> json) {
  return _AcceptInvitationRequest.fromJson(json);
}

/// @nodoc
mixin _$AcceptInvitationRequest {
  String get password => throw _privateConstructorUsedError;
  String get fullName => throw _privateConstructorUsedError;

  /// Serializes this AcceptInvitationRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AcceptInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AcceptInvitationRequestCopyWith<AcceptInvitationRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AcceptInvitationRequestCopyWith<$Res> {
  factory $AcceptInvitationRequestCopyWith(AcceptInvitationRequest value,
          $Res Function(AcceptInvitationRequest) then) =
      _$AcceptInvitationRequestCopyWithImpl<$Res, AcceptInvitationRequest>;
  @useResult
  $Res call({String password, String fullName});
}

/// @nodoc
class _$AcceptInvitationRequestCopyWithImpl<$Res,
        $Val extends AcceptInvitationRequest>
    implements $AcceptInvitationRequestCopyWith<$Res> {
  _$AcceptInvitationRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AcceptInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? password = null,
    Object? fullName = null,
  }) {
    return _then(_value.copyWith(
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AcceptInvitationRequestImplCopyWith<$Res>
    implements $AcceptInvitationRequestCopyWith<$Res> {
  factory _$$AcceptInvitationRequestImplCopyWith(
          _$AcceptInvitationRequestImpl value,
          $Res Function(_$AcceptInvitationRequestImpl) then) =
      __$$AcceptInvitationRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String password, String fullName});
}

/// @nodoc
class __$$AcceptInvitationRequestImplCopyWithImpl<$Res>
    extends _$AcceptInvitationRequestCopyWithImpl<$Res,
        _$AcceptInvitationRequestImpl>
    implements _$$AcceptInvitationRequestImplCopyWith<$Res> {
  __$$AcceptInvitationRequestImplCopyWithImpl(
      _$AcceptInvitationRequestImpl _value,
      $Res Function(_$AcceptInvitationRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of AcceptInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? password = null,
    Object? fullName = null,
  }) {
    return _then(_$AcceptInvitationRequestImpl(
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AcceptInvitationRequestImpl implements _AcceptInvitationRequest {
  const _$AcceptInvitationRequestImpl(
      {required this.password, required this.fullName});

  factory _$AcceptInvitationRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$AcceptInvitationRequestImplFromJson(json);

  @override
  final String password;
  @override
  final String fullName;

  @override
  String toString() {
    return 'AcceptInvitationRequest(password: $password, fullName: $fullName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AcceptInvitationRequestImpl &&
            (identical(other.password, password) ||
                other.password == password) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, password, fullName);

  /// Create a copy of AcceptInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AcceptInvitationRequestImplCopyWith<_$AcceptInvitationRequestImpl>
      get copyWith =>
          __$$AcceptInvitationRequestImplCopyWithImpl<
              _$AcceptInvitationRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AcceptInvitationRequestImplToJson(
      this,
    );
  }
}

abstract class _AcceptInvitationRequest implements AcceptInvitationRequest {
  const factory _AcceptInvitationRequest(
      {required final String password,
      required final String fullName}) = _$AcceptInvitationRequestImpl;

  factory _AcceptInvitationRequest.fromJson(Map<String, dynamic> json) =
      _$AcceptInvitationRequestImpl.fromJson;

  @override
  String get password;
  @override
  String get fullName;

  /// Create a copy of AcceptInvitationRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AcceptInvitationRequestImplCopyWith<_$AcceptInvitationRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
