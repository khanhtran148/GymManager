using CSharpFunctionalExtensions;
using GymManager.Application.Staff.Shared;
using MediatR;

namespace GymManager.Application.Staff.GetStaffById;

public sealed record GetStaffByIdQuery(Guid Id, Guid GymHouseId) : IRequest<Result<StaffDto>>;
