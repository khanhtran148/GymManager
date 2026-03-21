namespace GymManager.Application.Invitations.Shared;

public sealed record InvitationDto(
    Guid Id,
    string Email,
    string Role,
    Guid GymHouseId,
    string Token,
    DateTime ExpiresAt,
    string InviteUrl);
