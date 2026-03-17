using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Fakes;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace GymManager.Application.Tests;

public abstract class ApplicationTestBase : IntegrationTestBase
{
    protected FakeCurrentUser CurrentUser { get; } = new()
    {
        Permissions = Permission.Admin
    };

    protected ISender Sender => Services.GetRequiredService<ISender>();

    protected override void ConfigureServices(IServiceCollection services)
    {
        // Override ICurrentUser with our fake
        services.AddSingleton<ICurrentUser>(CurrentUser);
    }
}
