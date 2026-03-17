using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeUserRepository : IUserRepository
{
    private readonly List<User> _store = [];

    public void Seed(params User[] users) => _store.AddRange(users);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        Task.FromResult(_store.FirstOrDefault(u => u.Email == email && u.DeletedAt == null));

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        Task.FromResult(_store.FirstOrDefault(u => u.Id == id && u.DeletedAt == null));

    public Task CreateAsync(User user, CancellationToken ct = default)
    {
        _store.Add(user);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(User user, CancellationToken ct = default)
    {
        var idx = _store.FindIndex(u => u.Id == user.Id);
        if (idx >= 0) _store[idx] = user;
        return Task.CompletedTask;
    }

    public Task<List<User>> GetByRoleAndHouseAsync(Role role, Guid? gymHouseId, CancellationToken ct = default) =>
        Task.FromResult(_store.Where(u => u.Role == role && u.DeletedAt == null).ToList());

    public Task<List<User>> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default) =>
        Task.FromResult(_store.Where(u => u.Role == role && u.DeletedAt == null).ToList());
}
