using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Members.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Members.GetMemberById;

public sealed class GetMemberByIdQueryHandler(
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetMemberByIdQuery, Result<MemberDto>>
{
    public async Task<Result<MemberDto>> Handle(GetMemberByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewMembers, ct);
        if (!canView)
            return Result.Failure<MemberDto>(new ForbiddenError().ToString());

        var member = await memberRepository.GetByIdAsync(request.Id, ct);
        if (member is null)
            return Result.Failure<MemberDto>(new NotFoundError("Member", request.Id).ToString());

        return Result.Success(CreateMemberCommandHandler.ToDto(member));
    }
}
