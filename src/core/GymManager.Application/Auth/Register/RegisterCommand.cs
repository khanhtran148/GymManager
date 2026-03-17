using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using MediatR;

namespace GymManager.Application.Auth.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone) : IRequest<Result<AuthResponse>>;
