namespace GymManager.Application.Common.Models;

public sealed record PagedList<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
