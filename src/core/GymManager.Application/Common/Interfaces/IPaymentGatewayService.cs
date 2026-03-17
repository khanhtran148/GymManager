using CSharpFunctionalExtensions;

namespace GymManager.Application.Common.Interfaces;

public sealed record PaymentChargeResult(string ExternalReference, string Status);

public sealed record PaymentRefundResult(string ExternalReference, string Status);

public interface IPaymentGatewayService
{
    Task<Result<PaymentChargeResult>> CreateChargeAsync(
        decimal amount, string currency, string description, CancellationToken ct = default);

    Task<Result<PaymentRefundResult>> RefundChargeAsync(
        string externalReference, CancellationToken ct = default);
}
