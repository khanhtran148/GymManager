using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Member : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid GymHouseId { get; set; }
    public string MemberCode { get; set; } = string.Empty;
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
    public List<Subscription> Subscriptions { get; set; } = [];

    public static string GenerateMemberCode(string housePrefix, int sequence) =>
        $"{housePrefix}-{sequence:D5}";
}
