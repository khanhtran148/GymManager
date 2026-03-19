using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid UserId { get; }
    Guid TenantId { get; }
    string Email { get; }
    Permission Permissions { get; }
    Role Role { get; }
    bool IsAuthenticated { get; }
}
