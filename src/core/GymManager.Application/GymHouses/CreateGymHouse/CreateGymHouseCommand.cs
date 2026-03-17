using CSharpFunctionalExtensions;
using GymManager.Application.GymHouses.Shared;
using MediatR;

namespace GymManager.Application.GymHouses.CreateGymHouse;

public sealed record CreateGymHouseCommand(
    string Name,
    string Address,
    string? Phone,
    string? OperatingHours,
    int HourlyCapacity) : IRequest<Result<GymHouseDto>>;
