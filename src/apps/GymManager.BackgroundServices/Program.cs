using GymManager.Application;
using GymManager.BackgroundServices;
using GymManager.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddBackgroundServices();

var host = builder.Build();
await host.RunAsync();
