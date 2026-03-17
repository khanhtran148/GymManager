using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using MediatR;

namespace GymManager.Application.Notifications.MarkNotificationRead;

public sealed class MarkNotificationReadCommandHandler(
    INotificationDeliveryRepository deliveryRepository)
    : IRequestHandler<MarkNotificationReadCommand, Result>
{
    public async Task<Result> Handle(
        MarkNotificationReadCommand request, CancellationToken ct)
    {
        var delivery = await deliveryRepository.GetByIdAsync(request.NotificationId, ct);
        if (delivery is null)
            return Result.Failure(new NotFoundError("NotificationDelivery", request.NotificationId).ToString());

        if (delivery.RecipientId != request.CurrentUserId)
            return Result.Failure(new ForbiddenError().ToString());

        delivery.MarkRead(DateTime.UtcNow);
        await deliveryRepository.UpdateAsync(delivery, ct);

        return Result.Success();
    }
}
