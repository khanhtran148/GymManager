using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class MemberBuilder
{
    private Guid _userId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private string _memberCode = "GM-00001";
    private MembershipStatus _status = MembershipStatus.Active;
    private User? _user = null;

    public MemberBuilder WithUserId(Guid userId) { _userId = userId; return this; }
    public MemberBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public MemberBuilder WithMemberCode(string code) { _memberCode = code; return this; }
    public MemberBuilder WithStatus(MembershipStatus status) { _status = status; return this; }
    public MemberBuilder WithUser(User user) { _user = user; _userId = user.Id; return this; }

    public Member Build()
    {
        var member = new Member
        {
            UserId = _userId,
            GymHouseId = _gymHouseId,
            MemberCode = _memberCode,
            Status = _status
        };
        if (_user is not null)
            member.User = _user;
        return member;
    }
}
