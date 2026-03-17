using Microsoft.Extensions.DependencyInjection;

namespace GymManager.BackgroundServices;

public static class DependencyInjection
{
    public static IServiceCollection AddBackgroundServices(this IServiceCollection services)
    {
        // Register hosted services and Quartz jobs here
        return services;
    }
}
