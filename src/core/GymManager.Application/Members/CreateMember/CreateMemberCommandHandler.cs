using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Members.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using Mapster;
using MediatR;

namespace GymManager.Application.Members.CreateMember;

public sealed class CreateMemberCommandHandler(
    IMemberRepository memberRepository,
    IUserRepository userRepository,
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CreateMemberCommand, Result<MemberDto>>
{
    public async Task<Result<MemberDto>> Handle(CreateMemberCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageMembers, ct);
        if (!canManage)
            return Result.Failure<MemberDto>(new ForbiddenError().ToString());

        var gymHouse = await gymHouseRepository.GetByIdAsync(request.GymHouseId, ct);
        if (gymHouse is null)
            return Result.Failure<MemberDto>(new NotFoundError("GymHouse", request.GymHouseId).ToString());

        var exists = await memberRepository.ExistsByEmailAndHouseAsync(request.Email, request.GymHouseId, ct);
        if (exists)
            return Result.Failure<MemberDto>(new ConflictError("A member with this email already exists in this gym.").ToString());

        // Get or create user account
        var user = await userRepository.GetByEmailAsync(request.Email.ToLowerInvariant(), ct);
        if (user is null)
        {
            user = new User
            {
                Email = request.Email.ToLowerInvariant(),
                PasswordHash = string.Empty,
                FullName = request.FullName,
                Phone = request.Phone,
                Role = Role.Member,
                Permissions = Permission.ViewMembers | Permission.ViewSubscriptions
            };
            await userRepository.CreateAsync(user, ct);
        }

        var sequence = await memberRepository.GetNextSequenceAsync(request.GymHouseId, ct);
        var housePrefix = gymHouse.Name.Length >= 2
            ? gymHouse.Name[..2].ToUpperInvariant()
            : gymHouse.Name.ToUpperInvariant();
        var memberCode = Member.GenerateMemberCode(housePrefix, sequence);

        var member = new Member
        {
            UserId = user.Id,
            GymHouseId = request.GymHouseId,
            MemberCode = memberCode,
            User = user
        };

        await memberRepository.CreateAsync(member, ct);

        await publisher.Publish(new MemberCreatedEvent(member.Id, request.GymHouseId), ct);

        return Result.Success(member.Adapt<MemberDto>());
    }
}
