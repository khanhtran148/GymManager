// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_invitation_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CreateInvitationRequestImpl _$$CreateInvitationRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateInvitationRequestImpl(
      email: json['email'] as String,
      role: $enumDecode(_$InvitationRoleEnumMap, json['role']),
      gymHouseId: json['gymHouseId'] as String,
    );

Map<String, dynamic> _$$CreateInvitationRequestImplToJson(
        _$CreateInvitationRequestImpl instance) =>
    <String, dynamic>{
      'email': instance.email,
      'role': _$InvitationRoleEnumMap[instance.role]!,
      'gymHouseId': instance.gymHouseId,
    };

const _$InvitationRoleEnumMap = {
  InvitationRole.houseManager: 'HouseManager',
  InvitationRole.trainer: 'Trainer',
  InvitationRole.staff: 'Staff',
  InvitationRole.member: 'Member',
};
