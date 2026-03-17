using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.GymHouses.DeleteGymHouse;

public sealed record DeleteGymHouseCommand(Guid Id) : IRequest<Result>;
