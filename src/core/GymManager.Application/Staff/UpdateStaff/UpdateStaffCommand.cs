using CSharpFunctionalExtensions;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Staff.UpdateStaff;

public sealed record UpdateStaffCommand(
    Guid Id,
    Guid GymHouseId,
    StaffType StaffType,
    decimal BaseSalary,
    decimal PerClassBonus) : IRequest<Result<StaffDto>>;
