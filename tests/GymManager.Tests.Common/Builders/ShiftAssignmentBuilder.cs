using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class ShiftAssignmentBuilder
{
    private Guid _staffId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private DateOnly _shiftDate = DateOnly.FromDateTime(DateTime.UtcNow);
    private TimeOnly _startTime = new(8, 0);
    private TimeOnly _endTime = new(16, 0);
    private ShiftType _shiftType = ShiftType.Morning;
    private ShiftStatus _status = ShiftStatus.Scheduled;

    public ShiftAssignmentBuilder WithStaffId(Guid id) { _staffId = id; return this; }
    public ShiftAssignmentBuilder WithGymHouseId(Guid id) { _gymHouseId = id; return this; }
    public ShiftAssignmentBuilder WithShiftDate(DateOnly date) { _shiftDate = date; return this; }
    public ShiftAssignmentBuilder WithStartTime(TimeOnly time) { _startTime = time; return this; }
    public ShiftAssignmentBuilder WithEndTime(TimeOnly time) { _endTime = time; return this; }
    public ShiftAssignmentBuilder WithShiftType(ShiftType type) { _shiftType = type; return this; }
    public ShiftAssignmentBuilder WithStatus(ShiftStatus status) { _status = status; return this; }

    public ShiftAssignment Build() => new()
    {
        StaffId = _staffId,
        GymHouseId = _gymHouseId,
        ShiftDate = _shiftDate,
        StartTime = _startTime,
        EndTime = _endTime,
        ShiftType = _shiftType,
        Status = _status
    };
}
