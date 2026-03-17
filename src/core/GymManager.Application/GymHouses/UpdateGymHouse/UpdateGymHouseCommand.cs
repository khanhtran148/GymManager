using CSharpFunctionalExtensions;
using GymManager.Application.GymHouses.Shared;
using MediatR;

namespace GymManager.Application.GymHouses.UpdateGymHouse;

public sealed record UpdateGymHouseCommand(
    Guid Id,
    string Name,
    string Address,
    string? Phone,
    string? OperatingHours,
    int HourlyCapacity) : IRequest<Result<GymHouseDto>>;
