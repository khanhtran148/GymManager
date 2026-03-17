using CSharpFunctionalExtensions;
using GymManager.Application.Members.Shared;
using MediatR;

namespace GymManager.Application.Members.GetMemberById;

public sealed record GetMemberByIdQuery(Guid Id, Guid GymHouseId) : IRequest<Result<MemberDto>>;
