using GymManager.Application.Bookings.Shared;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Members.Shared;
using GymManager.Application.Payroll.Shared;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Application.Staff.Shared;
using GymManager.Application.TimeSlots.Shared;
using GymManager.Domain.Entities;
using Mapster;

namespace GymManager.Application.Common.Mapping;

public static class MappingConfig
{
    public static void Configure()
    {
        // Staff -> StaffDto: flatten User navigation
        TypeAdapterConfig<Domain.Entities.Staff, StaffDto>.NewConfig()
            .Map(dest => dest.UserName, src => src.User != null ? src.User.FullName : string.Empty)
            .Map(dest => dest.UserEmail, src => src.User != null ? src.User.Email : string.Empty);

        // ShiftAssignment -> ShiftAssignmentDto: flatten Staff.User navigation
        TypeAdapterConfig<ShiftAssignment, ShiftAssignmentDto>.NewConfig()
            .Map(dest => dest.StaffName,
                src => src.Staff != null && src.Staff.User != null ? src.Staff.User.FullName : string.Empty);

        // PayrollEntry -> PayrollEntryDto: flatten Staff.User and Staff.StaffType
        TypeAdapterConfig<PayrollEntry, PayrollEntryDto>.NewConfig()
            .Map(dest => dest.StaffName,
                src => src.Staff != null && src.Staff.User != null ? src.Staff.User.FullName : string.Empty)
            .Map(dest => dest.StaffType,
                src => src.Staff != null ? src.Staff.StaffType : default);

        // PayrollPeriod -> PayrollPeriodDto: computed aggregates
        TypeAdapterConfig<PayrollPeriod, PayrollPeriodDto>.NewConfig()
            .Map(dest => dest.TotalNetPay, src => src.Entries.Sum(e => e.NetPay))
            .Map(dest => dest.EntryCount, src => src.Entries.Count);

        // PayrollPeriod -> PayrollPeriodDetailDto: nested collection mapping + computed sum
        TypeAdapterConfig<PayrollPeriod, PayrollPeriodDetailDto>.NewConfig()
            .Map(dest => dest.Entries, src => src.Entries.Adapt<List<PayrollEntryDto>>())
            .Map(dest => dest.TotalNetPay, src => src.Entries.Sum(e => e.NetPay));

        // Member -> MemberDto: flatten User navigation
        TypeAdapterConfig<Member, MemberDto>.NewConfig()
            .Map(dest => dest.FullName, src => src.User.FullName)
            .Map(dest => dest.Email, src => src.User.Email)
            .Map(dest => dest.Phone, src => src.User != null ? src.User.Phone : null);

        // ClassSchedule -> ClassScheduleDto: flatten Trainer navigation + computed AvailableSpots
        TypeAdapterConfig<ClassSchedule, ClassScheduleDto>.NewConfig()
            .Map(dest => dest.TrainerName, src => src.Trainer != null ? src.Trainer.FullName : string.Empty)
            .Map(dest => dest.AvailableSpots, src => src.MaxCapacity - src.CurrentEnrollment);

        // TimeSlot -> TimeSlotDto: computed AvailableSpots
        TypeAdapterConfig<TimeSlot, TimeSlotDto>.NewConfig()
            .Map(dest => dest.AvailableSpots, src => src.MaxCapacity - src.CurrentBookings);

        // Booking -> BookingDto base mapping (MemberName and MemberCode require external Member)
        // These two fields must be supplied via BookingMapper.ToDto(Booking, Member)
        TypeAdapterConfig<Booking, BookingDto>.NewConfig()
            .Map(dest => dest.MemberName, src => string.Empty)
            .Map(dest => dest.MemberCode, src => string.Empty);

        // Transaction -> TransactionDto: simple 1:1 (all property names match, handled by convention)
        // GymHouse -> GymHouseDto: simple 1:1 (all property names match, handled by convention)
        // Subscription -> SubscriptionDto: simple 1:1 (all property names match, handled by convention)
    }
}
