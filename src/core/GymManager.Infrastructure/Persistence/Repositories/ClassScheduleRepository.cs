using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class ClassScheduleRepository(GymManagerDbContext db) : IClassScheduleRepository
{
    public async Task CreateAsync(ClassSchedule classSchedule, CancellationToken ct = default)
    {
        db.ClassSchedules.Add(classSchedule);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ClassSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.ClassSchedules
            .Include(c => c.Trainer)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<ClassSchedule?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default)
    {
        var classSchedule = await db.ClassSchedules
            .FromSqlInterpolated($"SELECT * FROM class_schedules WHERE id = {id} AND deleted_at IS NULL FOR UPDATE")
            .FirstOrDefaultAsync(ct);

        if (classSchedule is not null)
        {
            await db.Entry(classSchedule).Reference(c => c.Trainer).LoadAsync(ct);
        }

        return classSchedule;
    }

    public async Task UpdateAsync(ClassSchedule classSchedule, CancellationToken ct = default)
    {
        var tracked = await db.ClassSchedules.FindAsync([classSchedule.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(classSchedule);
        }
        else
        {
            db.ClassSchedules.Update(classSchedule);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<List<ClassSchedule>> GetByGymHouseIdAsync(
        Guid gymHouseId, DayOfWeek? dayOfWeek, CancellationToken ct = default)
    {
        var query = db.ClassSchedules
            .Include(c => c.Trainer)
            .AsNoTracking()
            .Where(c => c.GymHouseId == gymHouseId);

        if (dayOfWeek.HasValue)
            query = query.Where(c => c.DayOfWeek == dayOfWeek.Value);

        return await query
            .OrderBy(c => c.DayOfWeek)
            .ThenBy(c => c.StartTime)
            .ToListAsync(ct);
    }

    public async Task<bool> HasTrainerConflictAsync(
        Guid gymHouseId, Guid trainerId, DayOfWeek dayOfWeek,
        TimeOnly startTime, TimeOnly endTime, Guid? excludeId, CancellationToken ct = default) =>
        await db.ClassSchedules
            .AsNoTracking()
            .AnyAsync(c =>
                c.GymHouseId == gymHouseId &&
                c.TrainerId == trainerId &&
                c.DayOfWeek == dayOfWeek &&
                c.StartTime < endTime &&
                c.EndTime > startTime &&
                (excludeId == null || c.Id != excludeId.Value), ct);
}
