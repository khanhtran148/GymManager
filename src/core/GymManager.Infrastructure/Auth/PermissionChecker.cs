using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Auth;

public sealed class PermissionChecker(ICurrentUser currentUser, ILogger<PermissionChecker> logger) : IPermissionChecker
{
    public bool HasPermission(Guid userId, Guid tenantId, Permission required)
    {
        if (userId != currentUser.UserId)
        {
            logger.LogWarning(
                "PermissionChecker called with userId '{RequestedUserId}' but current user is '{CurrentUserId}'. Denying access.",
                userId, currentUser.UserId);
            return false;
        }

        return (currentUser.Permissions & required) == required;
    }

    public Task<bool> HasPermissionAsync(
        Guid userId, Guid tenantId, Permission required, CancellationToken ct = default) =>
        Task.FromResult(HasPermission(userId, tenantId, required));
}
