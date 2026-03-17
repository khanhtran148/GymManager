using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;

namespace GymManager.Infrastructure.Auth;

public sealed class PermissionChecker(ICurrentUser currentUser) : IPermissionChecker
{
    public bool HasPermission(Guid userId, Guid tenantId, Permission required) =>
        (currentUser.Permissions & required) == required;

    public Task<bool> HasPermissionAsync(
        Guid userId, Guid tenantId, Permission required, CancellationToken ct = default) =>
        Task.FromResult((currentUser.Permissions & required) == required);
}
