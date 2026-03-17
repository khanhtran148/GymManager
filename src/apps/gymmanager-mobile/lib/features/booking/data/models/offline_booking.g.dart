// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offline_booking.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BookingRequestImpl _$$BookingRequestImplFromJson(Map<String, dynamic> json) =>
    _$BookingRequestImpl(
      gymHouseId: json['gymHouseId'] as String,
      memberId: json['memberId'] as String,
      bookingType: (json['bookingType'] as num).toInt(),
      timeSlotId: json['timeSlotId'] as String?,
      classScheduleId: json['classScheduleId'] as String?,
    );

Map<String, dynamic> _$$BookingRequestImplToJson(
        _$BookingRequestImpl instance) =>
    <String, dynamic>{
      'gymHouseId': instance.gymHouseId,
      'memberId': instance.memberId,
      'bookingType': instance.bookingType,
      'timeSlotId': instance.timeSlotId,
      'classScheduleId': instance.classScheduleId,
    };

_$OfflineBookingImpl _$$OfflineBookingImplFromJson(Map<String, dynamic> json) =>
    _$OfflineBookingImpl(
      id: json['id'] as String,
      timeSlotId: json['timeSlotId'] as String,
      bookingType: json['bookingType'] as String,
      payload: json['payload'] as String,
      createdAt: json['createdAt'] as String,
      syncStatus: $enumDecode(_$SyncStatusEnumMap, json['syncStatus']),
      failureReason: json['failureReason'] as String?,
    );

Map<String, dynamic> _$$OfflineBookingImplToJson(
        _$OfflineBookingImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'timeSlotId': instance.timeSlotId,
      'bookingType': instance.bookingType,
      'payload': instance.payload,
      'createdAt': instance.createdAt,
      'syncStatus': _$SyncStatusEnumMap[instance.syncStatus]!,
      'failureReason': instance.failureReason,
    };

const _$SyncStatusEnumMap = {
  SyncStatus.pending: 'pending',
  SyncStatus.syncing: 'syncing',
  SyncStatus.failed: 'failed',
  SyncStatus.synced: 'synced',
};
