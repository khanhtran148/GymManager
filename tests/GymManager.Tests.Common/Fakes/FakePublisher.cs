using MediatR;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakePublisher : IPublisher
{
    public List<INotification> PublishedEvents { get; } = [];

    public Task Publish(object notification, CancellationToken cancellationToken = default)
    {
        if (notification is INotification n)
            PublishedEvents.Add(n);
        return Task.CompletedTask;
    }

    public Task Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default)
        where TNotification : INotification
    {
        PublishedEvents.Add(notification);
        return Task.CompletedTask;
    }
}
