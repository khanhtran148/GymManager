namespace GymManager.Application.Roles.Shared;

public sealed record RolePermissionDto(
    string Role,
    int RoleValue,
    string Permissions,
    List<string> PermissionNames);
