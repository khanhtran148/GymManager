using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Roles.GetRolesMetadata;

public sealed record GetRolesMetadataQuery : IRequest<Result<RolesMetadataDto>>;
