using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Staff.GetStaff;

public sealed record GetStaffQuery(
    Guid GymHouseId,
    int Page,
    int PageSize,
    StaffType? StaffType = null) : IRequest<Result<PagedList<StaffDto>>>;
