using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class InvitationBuilder
{
    private Guid _tenantId = Guid.NewGuid();
    private string _email = "invited@example.com";
    private Role _role = Role.Staff;
    private Guid _gymHouseId = Guid.NewGuid();
    private string _token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    private DateTime _expiresAt = DateTime.UtcNow.AddHours(48);
    private Guid _createdBy = Guid.NewGuid();

    public InvitationBuilder WithEmail(string email) { _email = email; return this; }
    public InvitationBuilder WithRole(Role role) { _role = role; return this; }
    public InvitationBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public InvitationBuilder WithTenantId(Guid tenantId) { _tenantId = tenantId; return this; }
    public InvitationBuilder WithToken(string token) { _token = token; return this; }
    public InvitationBuilder WithExpiresAt(DateTime expiresAt) { _expiresAt = expiresAt; return this; }
    public InvitationBuilder WithCreatedBy(Guid createdBy) { _createdBy = createdBy; return this; }

    public Invitation Build() => new()
    {
        TenantId = _tenantId,
        Email = _email.ToLowerInvariant(),
        Role = _role,
        GymHouseId = _gymHouseId,
        Token = _token,
        ExpiresAt = _expiresAt,
        CreatedBy = _createdBy
    };
}
