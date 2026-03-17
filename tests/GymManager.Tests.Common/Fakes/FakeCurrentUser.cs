using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeCurrentUser : ICurrentUser
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = "test@example.com";
    public Permission Permissions { get; set; } = Permission.Admin;
    public bool IsAuthenticated { get; set; } = true;
}
