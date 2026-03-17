using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Roles.ChangeUserRole;

public sealed class ChangeUserRoleCommandHandler(
    IUserRepository userRepository,
    IRolePermissionRepository rolePermissionRepository,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<ChangeUserRoleCommand, Result>
{
    public async Task<Result> Handle(ChangeUserRoleCommand request, CancellationToken ct)
    {
        if (currentUser.Role != Role.Owner)
            return Result.Failure(new ForbiddenError("Access denied.").ToString());

        var user = await userRepository.GetByIdAsync(request.UserId, ct);
        if (user is null)
            return Result.Failure(new NotFoundError("User", request.UserId).ToString());

        if (user.Role == Role.Owner)
            return Result.Failure("Cannot change the role of an Owner.");

        if (request.Role == Role.Owner)
            return Result.Failure("Cannot assign Owner role to a user.");

        var newRolePermission = await rolePermissionRepository
            .GetByTenantAndRoleAsync(currentUser.TenantId, request.Role, ct);

        var newPermissions = newRolePermission?.Permissions
            ?? RolePermissionDefaults.GetDefaultPermissions(request.Role);

        user.Role = request.Role;
#pragma warning disable CS0618 // user.Permissions kept in sync for backward compatibility
        user.Permissions = newPermissions;
#pragma warning restore CS0618

        await userRepository.UpdateAsync(user, ct);

        await publisher.Publish(
            new PermissionsChangedEvent(user.Id, request.Role.ToString(), (long)newPermissions),
            ct);

        return Result.Success();
    }
}
