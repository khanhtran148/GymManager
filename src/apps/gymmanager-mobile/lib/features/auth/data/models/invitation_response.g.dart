// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invitation_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$InvitationResponseImpl _$$InvitationResponseImplFromJson(
        Map<String, dynamic> json) =>
    _$InvitationResponseImpl(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      gymHouseId: json['gymHouseId'] as String,
      token: json['token'] as String,
      expiresAt: json['expiresAt'] as String,
      inviteUrl: json['inviteUrl'] as String,
    );

Map<String, dynamic> _$$InvitationResponseImplToJson(
        _$InvitationResponseImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'role': instance.role,
      'gymHouseId': instance.gymHouseId,
      'token': instance.token,
      'expiresAt': instance.expiresAt,
      'inviteUrl': instance.inviteUrl,
    };
