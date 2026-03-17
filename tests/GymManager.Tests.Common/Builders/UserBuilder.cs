using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class UserBuilder
{
    private string _email = "owner@example.com";
    private string _passwordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234");
    private string _fullName = "Test Owner";
    private string? _phone = null;
    private Role _role = Role.Owner;
    private Permission _permissions = Permission.Admin;

    public UserBuilder WithEmail(string email) { _email = email; return this; }
    public UserBuilder WithPasswordHash(string hash) { _passwordHash = hash; return this; }
    public UserBuilder WithFullName(string name) { _fullName = name; return this; }
    public UserBuilder WithPhone(string? phone) { _phone = phone; return this; }
    public UserBuilder WithRole(Role role) { _role = role; return this; }
    public UserBuilder WithPermissions(Permission permissions) { _permissions = permissions; return this; }

    public User Build() => new()
    {
        Email = _email.ToLowerInvariant(),
        PasswordHash = _passwordHash,
        FullName = _fullName,
        Phone = _phone,
        Role = _role,
        Permissions = _permissions
    };
}
