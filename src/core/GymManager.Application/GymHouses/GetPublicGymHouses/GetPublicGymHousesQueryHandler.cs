using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using MediatR;

namespace GymManager.Application.GymHouses.GetPublicGymHouses;

public sealed class GetPublicGymHousesQueryHandler(IGymHouseRepository gymHouseRepository)
    : IRequestHandler<GetPublicGymHousesQuery, Result<List<GymHousePublicDto>>>
{
    public async Task<Result<List<GymHousePublicDto>>> Handle(
        GetPublicGymHousesQuery request, CancellationToken ct)
    {
        var houses = await gymHouseRepository.GetAllActiveAsync(ct);

        var dtos = houses
            .Select(h => new GymHousePublicDto(h.Id, h.Name, h.Address))
            .ToList();

        return Result.Success(dtos);
    }
}
