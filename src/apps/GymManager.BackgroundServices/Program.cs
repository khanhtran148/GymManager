using GymManager.Application;
using GymManager.BackgroundServices;
using GymManager.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddBackgroundServices();
builder.Services.AddScoped<GymManager.Application.Common.Interfaces.INotificationHub,
    GymManager.Infrastructure.Notifications.NoOpNotificationHub>();

var host = builder.Build();
await host.RunAsync();
