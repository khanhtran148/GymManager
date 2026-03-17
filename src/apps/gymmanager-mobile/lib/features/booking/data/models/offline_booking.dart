import 'package:freezed_annotation/freezed_annotation.dart';

part 'offline_booking.freezed.dart';
part 'offline_booking.g.dart';

/// Sync state lifecycle:
///   pending  -> syncing -> synced
///                       -> failed
enum SyncStatus {
  pending,
  syncing,
  failed,
  synced;

  static SyncStatus fromString(String value) {
    return SyncStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => SyncStatus.pending,
    );
  }
}

/// Mirrors the POST /api/v1/gymhouses/{gymHouseId}/bookings request body.
@freezed
class BookingRequest with _$BookingRequest {
  const factory BookingRequest({
    required String gymHouseId,
    required String memberId,
    required int bookingType,
    String? timeSlotId,
    String? classScheduleId,
  }) = _BookingRequest;

  factory BookingRequest.fromJson(Map<String, dynamic> json) =>
      _$BookingRequestFromJson(json);
}

/// A booking that has been stored locally while the device was offline.
@freezed
class OfflineBooking with _$OfflineBooking {
  const factory OfflineBooking({
    required String id,
    required String timeSlotId,
    required String bookingType,

    /// JSON-encoded [BookingRequest].
    required String payload,
    required String createdAt,
    required SyncStatus syncStatus,

    /// Populated when [syncStatus] is [SyncStatus.failed].
    String? failureReason,
  }) = _OfflineBooking;

  factory OfflineBooking.fromJson(Map<String, dynamic> json) =>
      _$OfflineBookingFromJson(json);

  factory OfflineBooking.fromMap(Map<String, dynamic> map) => OfflineBooking(
        id: map['id'] as String,
        timeSlotId: map['time_slot_id'] as String,
        bookingType: map['booking_type'] as String,
        payload: map['payload'] as String,
        createdAt: map['created_at'] as String,
        syncStatus: SyncStatus.fromString(map['sync_status'] as String),
        failureReason: map['failure_reason'] as String?,
      );
}

extension OfflineBookingMapExtension on OfflineBooking {
  Map<String, dynamic> toMap() => {
        'id': id,
        'time_slot_id': timeSlotId,
        'booking_type': bookingType,
        'payload': payload,
        'created_at': createdAt,
        'sync_status': syncStatus.name,
        'failure_reason': failureReason,
      };
}
