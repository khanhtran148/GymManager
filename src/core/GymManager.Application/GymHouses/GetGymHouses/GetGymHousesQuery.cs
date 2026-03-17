using CSharpFunctionalExtensions;
using GymManager.Application.GymHouses.Shared;
using MediatR;

namespace GymManager.Application.GymHouses.GetGymHouses;

public sealed record GetGymHousesQuery : IRequest<Result<List<GymHouseDto>>>;
