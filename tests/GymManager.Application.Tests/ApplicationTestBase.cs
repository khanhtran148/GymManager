using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Fakes;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace GymManager.Application.Tests;

public abstract class ApplicationTestBase : IntegrationTestBase
{
    /// <summary>
    /// Alias for the base TestCurrentUser so existing tests don't break.
    /// Mutations on CurrentUser are reflected in the interceptor since they share the same instance.
    /// </summary>
    protected FakeCurrentUser CurrentUser => TestCurrentUser;

    protected ISender Sender => Services.GetRequiredService<ISender>();

    protected override void ConfigureServices(IServiceCollection services)
    {
        // Permissions default to Admin; test cases can narrow via CurrentUser.Permissions
        TestCurrentUser.Permissions = Permission.Admin;
    }
}
