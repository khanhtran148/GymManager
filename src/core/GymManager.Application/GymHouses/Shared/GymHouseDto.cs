namespace GymManager.Application.GymHouses.Shared;

public sealed record GymHouseDto(
    Guid Id,
    string Name,
    string Address,
    string? Phone,
    string? OperatingHours,
    int HourlyCapacity,
    Guid OwnerId,
    DateTime CreatedAt);
