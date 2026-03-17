using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task CreateAsync(User user, CancellationToken ct = default);
    Task UpdateAsync(User user, CancellationToken ct = default);

    /// <summary>
    /// Returns users with the given role that are members/staff of the specified gym house.
    /// When gymHouseId is null, returns all users with the given role (chain-wide).
    /// </summary>
    Task<List<User>> GetByRoleAndHouseAsync(Role role, Guid? gymHouseId, CancellationToken ct = default);
}
