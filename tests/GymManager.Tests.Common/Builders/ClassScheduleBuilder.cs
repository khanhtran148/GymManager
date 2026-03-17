using GymManager.Domain.Entities;

namespace GymManager.Tests.Common.Builders;

public sealed class ClassScheduleBuilder
{
    private Guid _gymHouseId = Guid.NewGuid();
    private Guid _trainerId = Guid.NewGuid();
    private string _className = "Yoga";
    private DayOfWeek _dayOfWeek = DayOfWeek.Monday;
    private TimeOnly _startTime = new(9, 0);
    private TimeOnly _endTime = new(10, 0);
    private int _maxCapacity = 20;
    private int _currentEnrollment = 0;
    private bool _isRecurring = true;
    private User? _trainer = null;

    public ClassScheduleBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public ClassScheduleBuilder WithTrainerId(Guid trainerId) { _trainerId = trainerId; return this; }
    public ClassScheduleBuilder WithClassName(string className) { _className = className; return this; }
    public ClassScheduleBuilder WithDayOfWeek(DayOfWeek dayOfWeek) { _dayOfWeek = dayOfWeek; return this; }
    public ClassScheduleBuilder WithStartTime(TimeOnly startTime) { _startTime = startTime; return this; }
    public ClassScheduleBuilder WithEndTime(TimeOnly endTime) { _endTime = endTime; return this; }
    public ClassScheduleBuilder WithMaxCapacity(int maxCapacity) { _maxCapacity = maxCapacity; return this; }
    public ClassScheduleBuilder WithCurrentEnrollment(int currentEnrollment) { _currentEnrollment = currentEnrollment; return this; }
    public ClassScheduleBuilder WithIsRecurring(bool isRecurring) { _isRecurring = isRecurring; return this; }
    public ClassScheduleBuilder WithTrainer(User trainer) { _trainer = trainer; _trainerId = trainer.Id; return this; }

    public ClassSchedule Build()
    {
        var schedule = new ClassSchedule
        {
            GymHouseId = _gymHouseId,
            TrainerId = _trainerId,
            ClassName = _className,
            DayOfWeek = _dayOfWeek,
            StartTime = _startTime,
            EndTime = _endTime,
            MaxCapacity = _maxCapacity,
            CurrentEnrollment = _currentEnrollment,
            IsRecurring = _isRecurring
        };
        if (_trainer is not null)
            schedule.Trainer = _trainer;
        return schedule;
    }
}
