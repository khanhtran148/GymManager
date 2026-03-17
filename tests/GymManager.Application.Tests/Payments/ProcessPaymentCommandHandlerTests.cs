using FluentAssertions;
using FluentValidation;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Payments.ProcessPayment;
using GymManager.Domain.Enums;
using GymManager.Tests.Common.Fakes;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Payments;

public sealed class ProcessPaymentCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Payment Gym", "123 Payment St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task ProcessPayment_WithValidCommand_SucceedsAndRecordsTransaction()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new ProcessPaymentCommand(
            gymHouseId,
            150m,
            "VND",
            "Monthly membership fee",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            PaymentMethod.Card);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.Amount.Should().Be(150m);
        result.Value.Direction.Should().Be(TransactionDirection.Credit);
        result.Value.TransactionType.Should().Be(TransactionType.MembershipFee);
        result.Value.ExternalReference.Should().NotBeNullOrEmpty();
        result.Value.ExternalReference.Should().StartWith("STUB-");
        result.Value.PaymentMethod.Should().Be(PaymentMethod.Card);
        result.Value.Id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ProcessPayment_WithoutProcessPaymentsPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewFinance;

        var command = new ProcessPaymentCommand(
            gymHouseId,
            100m,
            "VND",
            "Test payment",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            null);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-500.99)]
    public async Task ProcessPayment_WithInvalidAmount_ThrowsValidationException(decimal invalidAmount)
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new ProcessPaymentCommand(
            gymHouseId,
            invalidAmount,
            "VND",
            "Test payment",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            null);

        await Assert.ThrowsAsync<ValidationException>(() => Sender.Send(command));
    }

    [Fact]
    public async Task ProcessPayment_WithEmptyDescription_ThrowsValidationException()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new ProcessPaymentCommand(
            gymHouseId,
            100m,
            "VND",
            "",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            null);

        await Assert.ThrowsAsync<ValidationException>(() => Sender.Send(command));
    }

    [Fact]
    public async Task ProcessPayment_WithEmptyCurrency_ThrowsValidationException()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new ProcessPaymentCommand(
            gymHouseId,
            100m,
            "",
            "Test payment",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            null);

        await Assert.ThrowsAsync<ValidationException>(() => Sender.Send(command));
    }
}

/// <summary>
/// Application-layer unit tests for ProcessPaymentCommand using mocks (no DB).
/// These cover the gateway failure scenario without needing a real container.
/// </summary>
public sealed class ProcessPaymentCommandHandlerUnitTests
{
    [Fact]
    public async Task ProcessPayment_WhenGatewayFails_ReturnsFailure()
    {
        var gymHouseId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var fakeGateway = new FakeFailingPaymentGatewayService();
        var fakePermissions = new FakePermissionChecker(allow: true);
        var fakeCurrentUser = new GymManager.Tests.Common.Fakes.FakeCurrentUser
        {
            UserId = userId,
            TenantId = userId,
            Permissions = GymManager.Domain.Enums.Permission.Admin
        };
        var fakeTransactionRepo = new FakeTransactionRepository();

        var handler = new ProcessPaymentCommandHandler(
            fakeTransactionRepo,
            fakePermissions,
            fakeCurrentUser,
            fakeGateway,
            new FakePublisher());

        var command = new ProcessPaymentCommand(
            gymHouseId,
            100m,
            "VND",
            "Payment that will fail",
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            TransactionCategory.Revenue,
            DateTime.UtcNow,
            null,
            null,
            null);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Payment gateway error");
    }
}
