using CSharpFunctionalExtensions;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Staff.CreateStaff;

public sealed record CreateStaffCommand(
    Guid UserId,
    Guid GymHouseId,
    StaffType StaffType,
    decimal BaseSalary,
    decimal PerClassBonus) : IRequest<Result<StaffDto>>;
