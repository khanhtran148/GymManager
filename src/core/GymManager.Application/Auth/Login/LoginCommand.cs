using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using MediatR;

namespace GymManager.Application.Auth.Login;

public sealed record LoginCommand(
    string Email,
    string Password) : IRequest<Result<AuthResponse>>;
