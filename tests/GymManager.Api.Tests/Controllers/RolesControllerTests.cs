using CSharpFunctionalExtensions;
using FluentAssertions;
using GymManager.Api.Controllers;
using GymManager.Application.Roles.ChangeUserRole;
using GymManager.Application.Roles.GetRolePermissions;
using GymManager.Application.Roles.ResetDefaultPermissions;
using GymManager.Application.Roles.Shared;
using GymManager.Application.Roles.UpdateRolePermissions;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace GymManager.Api.Tests.Controllers;

/// <summary>
/// Fake ISender that records the last sent request and returns a pre-configured result.
/// </summary>
internal sealed class FakeSender : ISender
{
    public IBaseRequest? LastRequest { get; private set; }
    private object? _response;

    public void SetResponse(object response) => _response = response;

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        LastRequest = request;
        if (_response is TResponse typed)
            return Task.FromResult(typed);
        return Task.FromResult(default(TResponse)!);
    }

    public Task Send<TRequest>(TRequest request, CancellationToken cancellationToken = default)
        where TRequest : IRequest
    {
        LastRequest = request;
        return Task.CompletedTask;
    }

    public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamRequest<TResponse> request, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public IAsyncEnumerable<object?> CreateStream(object request, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<object?> Send(object request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}

public sealed class RolesControllerTests
{
    private static RolesController CreateController(FakeSender sender)
    {
        var controller = new RolesController(sender);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task GetPermissions_SendsGetRolePermissionsQuery()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success(new List<RolePermissionDto>()));
        var controller = CreateController(sender);

        await controller.GetPermissions(CancellationToken.None);

        sender.LastRequest.Should().BeOfType<GetRolePermissionsQuery>();
    }

    [Fact]
    public async Task GetPermissions_ReturnsOk_OnSuccess()
    {
        var sender = new FakeSender();
        var dtos = new List<RolePermissionDto>
        {
            new("Owner", 0, "-1", ["Admin"])
        };
        sender.SetResponse(Result.Success(dtos));
        var controller = CreateController(sender);

        var result = await controller.GetPermissions(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetPermissions_Returns403_OnForbidden()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Failure<List<RolePermissionDto>>("[FORBIDDEN] Access denied."));
        var controller = CreateController(sender);

        var result = await controller.GetPermissions(CancellationToken.None);

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task UpdateRolePermissions_SendsUpdateRolePermissionsCommand()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);

        await controller.UpdateRolePermissions(Role.Trainer, new UpdatePermissionsRequest("12345"), CancellationToken.None);

        sender.LastRequest.Should().BeOfType<UpdateRolePermissionsCommand>();
        var cmd = (UpdateRolePermissionsCommand)sender.LastRequest!;
        cmd.Role.Should().Be(Role.Trainer);
        cmd.Permissions.Should().Be("12345");
    }

    [Fact]
    public async Task UpdateRolePermissions_Returns204_OnSuccess()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);

        var result = await controller.UpdateRolePermissions(Role.Staff, new UpdatePermissionsRequest("100"), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ResetDefaults_SendsResetDefaultPermissionsCommand()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);

        await controller.ResetDefaults(CancellationToken.None);

        sender.LastRequest.Should().BeOfType<ResetDefaultPermissionsCommand>();
    }

    [Fact]
    public async Task ResetDefaults_Returns204_OnSuccess()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);

        var result = await controller.ResetDefaults(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }
}

public sealed class UserRoleControllerTests
{
    private static UserRoleController CreateController(FakeSender sender)
    {
        var controller = new UserRoleController(sender);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task ChangeUserRole_SendsCorrectCommand()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);
        var userId = Guid.NewGuid();

        await controller.ChangeUserRole(userId, new ChangeUserRoleRequest(Role.Trainer), CancellationToken.None);

        sender.LastRequest.Should().BeOfType<ChangeUserRoleCommand>();
        var cmd = (ChangeUserRoleCommand)sender.LastRequest!;
        cmd.UserId.Should().Be(userId);
        cmd.Role.Should().Be(Role.Trainer);
    }

    [Fact]
    public async Task ChangeUserRole_Returns204_OnSuccess()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Success());
        var controller = CreateController(sender);

        var result = await controller.ChangeUserRole(
            Guid.NewGuid(), new ChangeUserRoleRequest(Role.Staff), CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ChangeUserRole_Returns403_OnForbidden()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Failure("[FORBIDDEN] Access denied."));
        var controller = CreateController(sender);

        var result = await controller.ChangeUserRole(
            Guid.NewGuid(), new ChangeUserRoleRequest(Role.Staff), CancellationToken.None);

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task ChangeUserRole_Returns404_WhenUserNotFound()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Failure("[NOT_FOUND] User with id '...' was not found."));
        var controller = CreateController(sender);

        var result = await controller.ChangeUserRole(
            Guid.NewGuid(), new ChangeUserRoleRequest(Role.Staff), CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task ChangeUserRole_Returns400_OnBusinessRuleViolation()
    {
        var sender = new FakeSender();
        sender.SetResponse(Result.Failure("Cannot change the role of an Owner."));
        var controller = CreateController(sender);

        var result = await controller.ChangeUserRole(
            Guid.NewGuid(), new ChangeUserRoleRequest(Role.Staff), CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
