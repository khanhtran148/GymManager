using GymManager.Domain.Enums;

namespace GymManager.Application.Members.Shared;

public sealed record MemberDto(
    Guid Id,
    Guid GymHouseId,
    Guid UserId,
    string MemberCode,
    string FullName,
    string Email,
    string? Phone,
    MembershipStatus Status,
    DateTime JoinedAt);
