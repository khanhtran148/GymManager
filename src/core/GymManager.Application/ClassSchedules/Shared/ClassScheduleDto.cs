namespace GymManager.Application.ClassSchedules.Shared;

public sealed record ClassScheduleDto(
    Guid Id,
    Guid GymHouseId,
    Guid TrainerId,
    string TrainerName,
    string ClassName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    int CurrentEnrollment,
    int AvailableSpots,
    bool IsRecurring);
