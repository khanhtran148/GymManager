using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Members.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Members.UpdateMember;

public sealed class UpdateMemberCommandHandler(
    IMemberRepository memberRepository,
    IUserRepository userRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateMemberCommand, Result<MemberDto>>
{
    public async Task<Result<MemberDto>> Handle(UpdateMemberCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageMembers, ct);
        if (!canManage)
            return Result.Failure<MemberDto>(new ForbiddenError().ToString());

        var member = await memberRepository.GetByIdAsync(request.Id, ct);
        if (member is null)
            return Result.Failure<MemberDto>(new NotFoundError("Member", request.Id).ToString());

        var user = await userRepository.GetByIdAsync(member.UserId, ct);
        if (user is null)
            return Result.Failure<MemberDto>(new NotFoundError("User", member.UserId).ToString());

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        await userRepository.UpdateAsync(user, ct);

        member.User = user;
        await memberRepository.UpdateAsync(member, ct);

        return Result.Success(member.Adapt<MemberDto>());
    }
}
