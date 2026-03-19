using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.GetRoleUsers;

public sealed record GetRoleUsersQuery(
    Role Role,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedList<RoleUserDto>>>;
