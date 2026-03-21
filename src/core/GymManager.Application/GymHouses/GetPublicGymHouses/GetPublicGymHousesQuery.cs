using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.GymHouses.GetPublicGymHouses;

public sealed record GetPublicGymHousesQuery : IRequest<Result<List<GymHousePublicDto>>>;

public sealed record GymHousePublicDto(Guid Id, string Name, string Address);
