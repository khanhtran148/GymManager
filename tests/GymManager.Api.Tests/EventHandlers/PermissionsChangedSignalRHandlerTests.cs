using FluentAssertions;
using GymManager.Api.EventHandlers;
using GymManager.Domain.Events;
using GymManager.Tests.Common.Fakes;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace GymManager.Api.Tests.EventHandlers;

public sealed class PermissionsChangedSignalRHandlerTests
{
    private readonly FakeNotificationHub _hub = new();
    private readonly PermissionsChangedSignalRHandler _handler;

    public PermissionsChangedSignalRHandlerTests()
    {
        _handler = new PermissionsChangedSignalRHandler(
            _hub,
            NullLogger<PermissionsChangedSignalRHandler>.Instance);
    }

    [Fact]
    public async Task Handle_SendsToCorrectUserGroup()
    {
        var userId = Guid.NewGuid();
        var evt = new PermissionsChangedEvent(userId, "HouseManager", 16777215L);

        await _handler.Handle(evt, CancellationToken.None);

        _hub.SentMessages.Should().HaveCount(1);
        _hub.SentMessages[0].Group.Should().Be($"user:{userId}");
        _hub.SentMessages[0].Method.Should().Be("PermissionsChanged");
    }

    [Fact]
    public async Task Handle_IncludesCorrectRoleAndPermissionsInPayload()
    {
        var userId = Guid.NewGuid();
        var evt = new PermissionsChangedEvent(userId, "Owner", 67108863L);

        await _handler.Handle(evt, CancellationToken.None);

        _hub.SentMessages.Should().HaveCount(1);

        var payload = _hub.SentMessages[0].Payload;
        var payloadType = payload.GetType();

        var newRole = (string)payloadType.GetProperty("NewRole")!.GetValue(payload)!;
        var newPermissions = (string)payloadType.GetProperty("NewPermissions")!.GetValue(payload)!;
        var payloadUserId = (string)payloadType.GetProperty("UserId")!.GetValue(payload)!;

        newRole.Should().Be("Owner");
        newPermissions.Should().Be("67108863");
        payloadUserId.Should().Be(userId.ToString());
    }
}
