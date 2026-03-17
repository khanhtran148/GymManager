using GymManager.Domain.Enums;

namespace GymManager.Application.Staff.Shared;

public sealed record StaffDto(
    Guid Id,
    Guid UserId,
    Guid GymHouseId,
    StaffType StaffType,
    decimal BaseSalary,
    decimal PerClassBonus,
    DateTime HiredAt,
    string UserName,
    string UserEmail,
    DateTime CreatedAt);
