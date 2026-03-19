namespace GymManager.Application.Roles.Shared;

public sealed record RoleUserDto(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt);
