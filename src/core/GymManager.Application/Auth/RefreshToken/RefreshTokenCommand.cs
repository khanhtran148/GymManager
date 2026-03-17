using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using MediatR;

namespace GymManager.Application.Auth.RefreshToken;

public sealed record RefreshTokenCommand(string Token) : IRequest<Result<AuthResponse>>;
