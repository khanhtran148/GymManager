using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.GetRoleUsers;

public sealed class GetRoleUsersQueryHandler(
    IUserRepository userRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetRoleUsersQuery, Result<PagedList<RoleUserDto>>>
{
    public async Task<Result<PagedList<RoleUserDto>>> Handle(
        GetRoleUsersQuery request, CancellationToken ct)
    {
        if (currentUser.Role != Role.Owner)
            return Result.Failure<PagedList<RoleUserDto>>(new ForbiddenError("Access denied.").ToString());

        var users = await userRepository.GetByTenantAndRoleAsync(currentUser.TenantId, request.Role, ct);

        var totalCount = users.Count;
        var items = users
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new RoleUserDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.CreatedAt))
            .ToList();

        return Result.Success(new PagedList<RoleUserDto>(items, totalCount, request.Page, request.PageSize));
    }
}
