using CSharpFunctionalExtensions;
using GymManager.Application.GymHouses.Shared;
using MediatR;

namespace GymManager.Application.GymHouses.GetGymHouseById;

public sealed record GetGymHouseByIdQuery(Guid Id) : IRequest<Result<GymHouseDto>>;
