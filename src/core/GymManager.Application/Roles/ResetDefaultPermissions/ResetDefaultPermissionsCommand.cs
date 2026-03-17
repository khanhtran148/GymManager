using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Roles.ResetDefaultPermissions;

public sealed record ResetDefaultPermissionsCommand : IRequest<Result>;
