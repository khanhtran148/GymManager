using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Members.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Members.GetMembers;

public sealed class GetMembersQueryHandler(
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetMembersQuery, Result<PagedList<MemberDto>>>
{
    public async Task<Result<PagedList<MemberDto>>> Handle(GetMembersQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewMembers, ct);
        if (!canView)
            return Result.Failure<PagedList<MemberDto>>(new ForbiddenError().ToString());

        var paged = await memberRepository.GetByGymHouseIdAsync(
            request.GymHouseId, request.Page, request.PageSize, request.Search, ct);

        var dtos = paged.Items.Select(CreateMemberCommandHandler.ToDto).ToList();

        return Result.Success(new PagedList<MemberDto>(dtos, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
