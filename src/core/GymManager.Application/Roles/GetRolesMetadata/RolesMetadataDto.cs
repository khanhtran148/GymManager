namespace GymManager.Application.Roles.GetRolesMetadata;

public sealed record RolesMetadataDto(
    IReadOnlyList<RoleDefinitionDto> Roles,
    IReadOnlyList<PermissionDefinitionDto> Permissions,
    IReadOnlyList<RouteAccessDto> RouteAccess);

public sealed record RoleDefinitionDto(string Name, int Value, bool IsAssignable);

public sealed record PermissionDefinitionDto(string Name, int BitPosition, string Category);

public sealed record RouteAccessDto(string Path, IReadOnlyList<string> AllowedRoles);
