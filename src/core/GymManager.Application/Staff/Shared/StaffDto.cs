using GymManager.Domain.Entities;
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
    DateTime CreatedAt)
{
    internal static StaffDto FromEntity(Domain.Entities.Staff s) => new(
        s.Id,
        s.UserId,
        s.GymHouseId,
        s.StaffType,
        s.BaseSalary,
        s.PerClassBonus,
        s.HiredAt,
        s.User?.FullName ?? string.Empty,
        s.User?.Email ?? string.Empty,
        s.CreatedAt);
}
