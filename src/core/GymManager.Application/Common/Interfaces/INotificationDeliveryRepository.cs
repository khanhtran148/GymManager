using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface INotificationDeliveryRepository
{
    Task<NotificationDelivery?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedList<NotificationDelivery>> GetByRecipientAsync(Guid recipientId, int page, int pageSize, CancellationToken ct = default);
    Task CreateBatchAsync(IEnumerable<NotificationDelivery> deliveries, CancellationToken ct = default);
    Task UpdateAsync(NotificationDelivery delivery, CancellationToken ct = default);
}
