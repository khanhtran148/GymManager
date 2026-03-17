using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakePermissionChecker(bool allow = true) : IPermissionChecker
{
    public bool HasPermission(Guid userId, Guid tenantId, Permission required) => allow;

    public Task<bool> HasPermissionAsync(
        Guid userId, Guid tenantId, Permission required, CancellationToken ct = default) =>
        Task.FromResult(allow);
}
