using GymManager.Domain.Entities;

namespace GymManager.Application.ClassSchedules.Shared;

internal static class ClassScheduleMapper
{
    public static ClassScheduleDto ToDto(ClassSchedule cs) => new(
        cs.Id,
        cs.GymHouseId,
        cs.TrainerId,
        cs.Trainer?.FullName ?? string.Empty,
        cs.ClassName,
        cs.DayOfWeek,
        cs.StartTime,
        cs.EndTime,
        cs.MaxCapacity,
        cs.CurrentEnrollment,
        cs.MaxCapacity - cs.CurrentEnrollment,
        cs.IsRecurring);
}
