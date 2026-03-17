using GymManager.BackgroundServices.Jobs;
using Microsoft.Extensions.DependencyInjection;
using Quartz;

namespace GymManager.BackgroundServices;

public static class DependencyInjection
{
    public static IServiceCollection AddBackgroundServices(this IServiceCollection services)
    {
        services.AddQuartz(q =>
        {
            var jobKey = new JobKey("AnnouncementPublisherJob");

            q.AddJob<AnnouncementPublisherJob>(opts => opts.WithIdentity(jobKey));

            q.AddTrigger(opts => opts
                .ForJob(jobKey)
                .WithIdentity("AnnouncementPublisherTrigger")
                .WithSimpleSchedule(s => s
                    .WithIntervalInSeconds(30)
                    .RepeatForever()));
        });

        services.AddQuartzHostedService(options => options.WaitForJobsToComplete = true);

        return services;
    }
}
