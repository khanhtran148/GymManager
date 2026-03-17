using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;

namespace GymManager.Infrastructure.Payments;

/// <summary>
/// Development stub for IPaymentGatewayService.
/// Returns a fake external reference for all charges and refunds.
/// Replace with Stripe/PayOS implementation behind the same interface in production.
/// </summary>
public sealed class StubPaymentGatewayService : IPaymentGatewayService
{
    public Task<Result<PaymentChargeResult>> CreateChargeAsync(
        decimal amount, string currency, string description, CancellationToken ct = default)
    {
        var reference = $"STUB-{Guid.NewGuid():N}";
        var result = new PaymentChargeResult(reference, "succeeded");
        return Task.FromResult(Result.Success(result));
    }

    public Task<Result<PaymentRefundResult>> RefundChargeAsync(
        string externalReference, CancellationToken ct = default)
    {
        var result = new PaymentRefundResult(externalReference, "refunded");
        return Task.FromResult(Result.Success(result));
    }
}
