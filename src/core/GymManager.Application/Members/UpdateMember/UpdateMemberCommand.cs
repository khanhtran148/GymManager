using CSharpFunctionalExtensions;
using GymManager.Application.Members.Shared;
using MediatR;

namespace GymManager.Application.Members.UpdateMember;

public sealed record UpdateMemberCommand(
    Guid Id,
    Guid GymHouseId,
    string FullName,
    string? Phone) : IRequest<Result<MemberDto>>;
