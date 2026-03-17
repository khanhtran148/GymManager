// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'offline_booking.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

BookingRequest _$BookingRequestFromJson(Map<String, dynamic> json) {
  return _BookingRequest.fromJson(json);
}

/// @nodoc
mixin _$BookingRequest {
  String get gymHouseId => throw _privateConstructorUsedError;
  String get memberId => throw _privateConstructorUsedError;
  int get bookingType => throw _privateConstructorUsedError;
  String? get timeSlotId => throw _privateConstructorUsedError;
  String? get classScheduleId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $BookingRequestCopyWith<BookingRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BookingRequestCopyWith<$Res> {
  factory $BookingRequestCopyWith(
          BookingRequest value, $Res Function(BookingRequest) then) =
      _$BookingRequestCopyWithImpl<$Res, BookingRequest>;
  @useResult
  $Res call(
      {String gymHouseId,
      String memberId,
      int bookingType,
      String? timeSlotId,
      String? classScheduleId});
}

/// @nodoc
class _$BookingRequestCopyWithImpl<$Res, $Val extends BookingRequest>
    implements $BookingRequestCopyWith<$Res> {
  _$BookingRequestCopyWithImpl(this._value, this._then);

  final $Val _value;
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? gymHouseId = null,
    Object? memberId = null,
    Object? bookingType = null,
    Object? timeSlotId = freezed,
    Object? classScheduleId = freezed,
  }) {
    return _then(_value.copyWith(
      gymHouseId: null == gymHouseId
          ? _value.gymHouseId
          : gymHouseId as String,
      memberId:
          null == memberId ? _value.memberId : memberId as String,
      bookingType:
          null == bookingType ? _value.bookingType : bookingType as int,
      timeSlotId:
          freezed == timeSlotId ? _value.timeSlotId : timeSlotId as String?,
      classScheduleId: freezed == classScheduleId
          ? _value.classScheduleId
          : classScheduleId as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BookingRequestImplCopyWith<$Res>
    implements $BookingRequestCopyWith<$Res> {
  factory _$$BookingRequestImplCopyWith(_$BookingRequestImpl value,
          $Res Function(_$BookingRequestImpl) then) =
      __$$BookingRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String gymHouseId,
      String memberId,
      int bookingType,
      String? timeSlotId,
      String? classScheduleId});
}

/// @nodoc
class __$$BookingRequestImplCopyWithImpl<$Res>
    extends _$BookingRequestCopyWithImpl<$Res, _$BookingRequestImpl>
    implements _$$BookingRequestImplCopyWith<$Res> {
  __$$BookingRequestImplCopyWithImpl(
      _$BookingRequestImpl _value, $Res Function(_$BookingRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? gymHouseId = null,
    Object? memberId = null,
    Object? bookingType = null,
    Object? timeSlotId = freezed,
    Object? classScheduleId = freezed,
  }) {
    return _then(_$BookingRequestImpl(
      gymHouseId: null == gymHouseId ? _value.gymHouseId : gymHouseId as String,
      memberId: null == memberId ? _value.memberId : memberId as String,
      bookingType: null == bookingType ? _value.bookingType : bookingType as int,
      timeSlotId:
          freezed == timeSlotId ? _value.timeSlotId : timeSlotId as String?,
      classScheduleId: freezed == classScheduleId
          ? _value.classScheduleId
          : classScheduleId as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BookingRequestImpl implements _BookingRequest {
  const _$BookingRequestImpl(
      {required this.gymHouseId,
      required this.memberId,
      required this.bookingType,
      this.timeSlotId,
      this.classScheduleId});

  factory _$BookingRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$BookingRequestImplFromJson(json);

  @override
  final String gymHouseId;
  @override
  final String memberId;
  @override
  final int bookingType;
  @override
  final String? timeSlotId;
  @override
  final String? classScheduleId;

  @override
  String toString() {
    return 'BookingRequest(gymHouseId: $gymHouseId, memberId: $memberId, bookingType: $bookingType, timeSlotId: $timeSlotId, classScheduleId: $classScheduleId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BookingRequestImpl &&
            (identical(other.gymHouseId, gymHouseId) ||
                other.gymHouseId == gymHouseId) &&
            (identical(other.memberId, memberId) ||
                other.memberId == memberId) &&
            (identical(other.bookingType, bookingType) ||
                other.bookingType == bookingType) &&
            (identical(other.timeSlotId, timeSlotId) ||
                other.timeSlotId == timeSlotId) &&
            (identical(other.classScheduleId, classScheduleId) ||
                other.classScheduleId == classScheduleId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, gymHouseId, memberId, bookingType, timeSlotId, classScheduleId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$BookingRequestImplCopyWith<_$BookingRequestImpl> get copyWith =>
      __$$BookingRequestImplCopyWithImpl<_$BookingRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BookingRequestImplToJson(
      this,
    );
  }
}

abstract class _BookingRequest implements BookingRequest {
  const factory _BookingRequest(
      {required final String gymHouseId,
      required final String memberId,
      required final int bookingType,
      final String? timeSlotId,
      final String? classScheduleId}) = _$BookingRequestImpl;

  factory _BookingRequest.fromJson(Map<String, dynamic> json) =
      _$BookingRequestImpl.fromJson;

  @override
  String get gymHouseId;
  @override
  String get memberId;
  @override
  int get bookingType;
  @override
  String? get timeSlotId;
  @override
  String? get classScheduleId;
  @override
  @JsonKey(ignore: true)
  _$$BookingRequestImplCopyWith<_$BookingRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

OfflineBooking _$OfflineBookingFromJson(Map<String, dynamic> json) {
  return _OfflineBooking.fromJson(json);
}

/// @nodoc
mixin _$OfflineBooking {
  String get id => throw _privateConstructorUsedError;
  String get timeSlotId => throw _privateConstructorUsedError;
  String get bookingType => throw _privateConstructorUsedError;
  String get payload => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  SyncStatus get syncStatus => throw _privateConstructorUsedError;
  String? get failureReason => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $OfflineBookingCopyWith<OfflineBooking> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $OfflineBookingCopyWith<$Res> {
  factory $OfflineBookingCopyWith(
          OfflineBooking value, $Res Function(OfflineBooking) then) =
      _$OfflineBookingCopyWithImpl<$Res, OfflineBooking>;
  @useResult
  $Res call(
      {String id,
      String timeSlotId,
      String bookingType,
      String payload,
      String createdAt,
      SyncStatus syncStatus,
      String? failureReason});
}

/// @nodoc
class _$OfflineBookingCopyWithImpl<$Res, $Val extends OfflineBooking>
    implements $OfflineBookingCopyWith<$Res> {
  _$OfflineBookingCopyWithImpl(this._value, this._then);

  final $Val _value;
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? timeSlotId = null,
    Object? bookingType = null,
    Object? payload = null,
    Object? createdAt = null,
    Object? syncStatus = null,
    Object? failureReason = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id ? _value.id : id as String,
      timeSlotId:
          null == timeSlotId ? _value.timeSlotId : timeSlotId as String,
      bookingType:
          null == bookingType ? _value.bookingType : bookingType as String,
      payload: null == payload ? _value.payload : payload as String,
      createdAt: null == createdAt ? _value.createdAt : createdAt as String,
      syncStatus:
          null == syncStatus ? _value.syncStatus : syncStatus as SyncStatus,
      failureReason: freezed == failureReason
          ? _value.failureReason
          : failureReason as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$OfflineBookingImplCopyWith<$Res>
    implements $OfflineBookingCopyWith<$Res> {
  factory _$$OfflineBookingImplCopyWith(_$OfflineBookingImpl value,
          $Res Function(_$OfflineBookingImpl) then) =
      __$$OfflineBookingImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String timeSlotId,
      String bookingType,
      String payload,
      String createdAt,
      SyncStatus syncStatus,
      String? failureReason});
}

/// @nodoc
class __$$OfflineBookingImplCopyWithImpl<$Res>
    extends _$OfflineBookingCopyWithImpl<$Res, _$OfflineBookingImpl>
    implements _$$OfflineBookingImplCopyWith<$Res> {
  __$$OfflineBookingImplCopyWithImpl(
      _$OfflineBookingImpl _value, $Res Function(_$OfflineBookingImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? timeSlotId = null,
    Object? bookingType = null,
    Object? payload = null,
    Object? createdAt = null,
    Object? syncStatus = null,
    Object? failureReason = freezed,
  }) {
    return _then(_$OfflineBookingImpl(
      id: null == id ? _value.id : id as String,
      timeSlotId:
          null == timeSlotId ? _value.timeSlotId : timeSlotId as String,
      bookingType:
          null == bookingType ? _value.bookingType : bookingType as String,
      payload: null == payload ? _value.payload : payload as String,
      createdAt: null == createdAt ? _value.createdAt : createdAt as String,
      syncStatus:
          null == syncStatus ? _value.syncStatus : syncStatus as SyncStatus,
      failureReason: freezed == failureReason
          ? _value.failureReason
          : failureReason as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$OfflineBookingImpl implements _OfflineBooking {
  const _$OfflineBookingImpl(
      {required this.id,
      required this.timeSlotId,
      required this.bookingType,
      required this.payload,
      required this.createdAt,
      required this.syncStatus,
      this.failureReason});

  factory _$OfflineBookingImpl.fromJson(Map<String, dynamic> json) =>
      _$$OfflineBookingImplFromJson(json);

  @override
  final String id;
  @override
  final String timeSlotId;
  @override
  final String bookingType;
  @override
  final String payload;
  @override
  final String createdAt;
  @override
  final SyncStatus syncStatus;
  @override
  final String? failureReason;

  @override
  String toString() {
    return 'OfflineBooking(id: $id, timeSlotId: $timeSlotId, bookingType: $bookingType, payload: $payload, createdAt: $createdAt, syncStatus: $syncStatus, failureReason: $failureReason)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$OfflineBookingImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.timeSlotId, timeSlotId) ||
                other.timeSlotId == timeSlotId) &&
            (identical(other.bookingType, bookingType) ||
                other.bookingType == bookingType) &&
            (identical(other.payload, payload) || other.payload == payload) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.syncStatus, syncStatus) ||
                other.syncStatus == syncStatus) &&
            (identical(other.failureReason, failureReason) ||
                other.failureReason == failureReason));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, timeSlotId, bookingType,
      payload, createdAt, syncStatus, failureReason);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$OfflineBookingImplCopyWith<_$OfflineBookingImpl> get copyWith =>
      __$$OfflineBookingImplCopyWithImpl<_$OfflineBookingImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$OfflineBookingImplToJson(
      this,
    );
  }
}

abstract class _OfflineBooking implements OfflineBooking {
  const factory _OfflineBooking(
      {required final String id,
      required final String timeSlotId,
      required final String bookingType,
      required final String payload,
      required final String createdAt,
      required final SyncStatus syncStatus,
      final String? failureReason}) = _$OfflineBookingImpl;

  factory _OfflineBooking.fromJson(Map<String, dynamic> json) =
      _$OfflineBookingImpl.fromJson;

  @override
  String get id;
  @override
  String get timeSlotId;
  @override
  String get bookingType;
  @override
  String get payload;
  @override
  String get createdAt;
  @override
  SyncStatus get syncStatus;
  @override
  String? get failureReason;
  @override
  @JsonKey(ignore: true)
  _$$OfflineBookingImplCopyWith<_$OfflineBookingImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
