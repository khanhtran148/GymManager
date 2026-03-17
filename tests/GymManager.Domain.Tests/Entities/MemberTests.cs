using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class MemberTests
{
    [Theory]
    [InlineData("GH", 1, "GH-00001")]
    [InlineData("ABC", 100, "ABC-00100")]
    [InlineData("XY", 99999, "XY-99999")]
    public void GenerateMemberCode_ProducesCorrectFormat(string prefix, int seq, string expected)
    {
        var code = Member.GenerateMemberCode(prefix, seq);

        code.Should().Be(expected);
    }

    [Fact]
    public void Member_DefaultStatus_IsActive()
    {
        var member = new Member();

        member.Status.Should().Be(MembershipStatus.Active);
    }

    [Fact]
    public void Member_JoinedAt_IsSetToUtcNow_WhenCreated()
    {
        var before = DateTime.UtcNow;
        var member = new Member();
        var after = DateTime.UtcNow;

        member.JoinedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after);
    }
}
