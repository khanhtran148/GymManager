// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gym_house_public.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$GymHousePublicImpl _$$GymHousePublicImplFromJson(Map<String, dynamic> json) =>
    _$GymHousePublicImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
    );

Map<String, dynamic> _$$GymHousePublicImplToJson(
        _$GymHousePublicImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'address': instance.address,
    };

_$GymHousePublicListImpl _$$GymHousePublicListImplFromJson(
        Map<String, dynamic> json) =>
    _$GymHousePublicListImpl(
      items: (json['items'] as List<dynamic>)
          .map((e) => GymHousePublic.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$GymHousePublicListImplToJson(
        _$GymHousePublicListImpl instance) =>
    <String, dynamic>{
      'items': instance.items.map((e) => e.toJson()).toList(),
    };
