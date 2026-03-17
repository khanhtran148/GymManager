using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface IPermissionChecker
{
    bool HasPermission(Guid userId, Guid tenantId, Permission required);
    Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, Permission required, CancellationToken ct = default);
}
