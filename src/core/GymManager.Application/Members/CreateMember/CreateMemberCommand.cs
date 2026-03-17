using CSharpFunctionalExtensions;
using GymManager.Application.Members.Shared;
using MediatR;

namespace GymManager.Application.Members.CreateMember;

public sealed record CreateMemberCommand(
    Guid GymHouseId,
    string Email,
    string FullName,
    string? Phone) : IRequest<Result<MemberDto>>;
