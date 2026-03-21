import 'package:freezed_annotation/freezed_annotation.dart';

part 'gym_house_public.freezed.dart';
part 'gym_house_public.g.dart';

/// A publicly visible gym house record returned by
/// `GET /api/v1/gym-houses/public`.
@freezed
class GymHousePublic with _$GymHousePublic {
  const factory GymHousePublic({
    required String id,
    required String name,
    required String address,
  }) = _GymHousePublic;

  factory GymHousePublic.fromJson(Map<String, dynamic> json) =>
      _$GymHousePublicFromJson(json);
}

/// Wrapper around the paginated list response:
/// `{ "items": [ ... ] }`
@freezed
class GymHousePublicList with _$GymHousePublicList {
  const factory GymHousePublicList({
    required List<GymHousePublic> items,
  }) = _GymHousePublicList;

  factory GymHousePublicList.fromJson(Map<String, dynamic> json) =>
      _$GymHousePublicListFromJson(json);
}
