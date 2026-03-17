using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeFailingPaymentGatewayService : IPaymentGatewayService
{
    public Task<Result<PaymentChargeResult>> CreateChargeAsync(
        decimal amount, string currency, string description, CancellationToken ct = default) =>
        Task.FromResult(Result.Failure<PaymentChargeResult>("Payment gateway error: connection refused"));

    public Task<Result<PaymentRefundResult>> RefundChargeAsync(
        string externalReference, CancellationToken ct = default) =>
        Task.FromResult(Result.Failure<PaymentRefundResult>("Payment gateway error: refund not supported"));
}
