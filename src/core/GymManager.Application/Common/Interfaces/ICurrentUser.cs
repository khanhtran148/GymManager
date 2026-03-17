using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid UserId { get; }
    Guid TenantId { get; }
    string Email { get; }
    Permission Permissions { get; }
    bool IsAuthenticated { get; }
}
