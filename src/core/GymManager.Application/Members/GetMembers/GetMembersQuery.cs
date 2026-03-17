using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Members.Shared;
using MediatR;

namespace GymManager.Application.Members.GetMembers;

public sealed record GetMembersQuery(
    Guid GymHouseId,
    int Page = 1,
    int PageSize = 20,
    string? Search = null) : IRequest<Result<PagedList<MemberDto>>>;
