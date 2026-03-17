using FluentAssertions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Common.Mapping;
using GymManager.Application.GymHouses.Shared;
using GymManager.Application.Members.Shared;
using GymManager.Application.Payroll.Shared;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Application.Staff.Shared;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Application.TimeSlots.Shared;
using GymManager.Domain.Enums;
using GymManager.Tests.Common.Builders;
using Mapster;
using Xunit;

namespace GymManager.Application.Tests.Mapping;

public sealed class MappingConfigTests
{
    public MappingConfigTests()
    {
        MappingConfig.Configure();
    }

    [Fact]
    public void TransactionDto_MapsAllProperties()
    {
        var transaction = new TransactionBuilder()
            .WithGymHouseId(Guid.NewGuid())
            .WithType(TransactionType.MembershipFee)
            .WithDirection(TransactionDirection.Credit)
            .WithAmount(250m)
            .WithCategory(TransactionCategory.Revenue)
            .WithDescription("Monthly fee")
            .WithTransactionDate(new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc))
            .Build();

        var dto = transaction.Adapt<GymManager.Application.Transactions.Shared.TransactionDto>();

        dto.Id.Should().Be(transaction.Id);
        dto.GymHouseId.Should().Be(transaction.GymHouseId);
        dto.TransactionType.Should().Be(transaction.TransactionType);
        dto.Direction.Should().Be(transaction.Direction);
        dto.Amount.Should().Be(250m);
        dto.Category.Should().Be(transaction.Category);
        dto.Description.Should().Be("Monthly fee");
        dto.TransactionDate.Should().Be(transaction.TransactionDate);
        dto.RelatedEntityId.Should().BeNull();
        dto.ReversesTransactionId.Should().BeNull();
        dto.ReversedByTransactionId.Should().BeNull();
        dto.ApprovedById.Should().BeNull();
        dto.PaymentMethod.Should().BeNull();
        dto.ExternalReference.Should().BeNull();
    }

    [Fact]
    public void StaffDto_FlattensUserNavigation()
    {
        var user = new UserBuilder()
            .WithFullName("Jane Trainer")
            .WithEmail("jane@gym.com")
            .Build();

        var staff = new StaffBuilder()
            .WithStaffType(StaffType.Trainer)
            .WithBaseSalary(4000m)
            .WithPerClassBonus(75m)
            .Build();
        staff.User = user;

        var dto = staff.Adapt<StaffDto>();

        dto.UserName.Should().Be("Jane Trainer");
        dto.UserEmail.Should().Be("jane@gym.com");
        dto.StaffType.Should().Be(StaffType.Trainer);
        dto.BaseSalary.Should().Be(4000m);
        dto.PerClassBonus.Should().Be(75m);
        dto.UserId.Should().Be(staff.UserId);
        dto.GymHouseId.Should().Be(staff.GymHouseId);
    }

    [Fact]
    public void ShiftAssignmentDto_FlattensNestedNavigation()
    {
        var user = new UserBuilder().WithFullName("Bob Staff").Build();
        var staffEntity = new StaffBuilder().Build();
        staffEntity.User = user;

        var shift = new ShiftAssignmentBuilder()
            .WithShiftDate(new DateOnly(2026, 2, 10))
            .WithStartTime(new TimeOnly(8, 0))
            .WithEndTime(new TimeOnly(16, 0))
            .WithShiftType(ShiftType.Morning)
            .WithStatus(ShiftStatus.Scheduled)
            .Build();
        shift.Staff = staffEntity;

        var dto = shift.Adapt<ShiftAssignmentDto>();

        dto.StaffName.Should().Be("Bob Staff");
        dto.ShiftDate.Should().Be(new DateOnly(2026, 2, 10));
        dto.StartTime.Should().Be(new TimeOnly(8, 0));
        dto.EndTime.Should().Be(new TimeOnly(16, 0));
        dto.ShiftType.Should().Be(ShiftType.Morning);
        dto.Status.Should().Be(ShiftStatus.Scheduled);
    }

    [Fact]
    public void PayrollEntryDto_FlattensStaffNavigation()
    {
        var user = new UserBuilder().WithFullName("Alice Trainer").Build();
        var staffEntity = new StaffBuilder().WithStaffType(StaffType.Trainer).Build();
        staffEntity.User = user;

        var entry = new PayrollEntryBuilder()
            .WithBasePay(3000m)
            .WithClassBonus(500m)
            .WithDeductions(100m)
            .WithClassesTaught(10)
            .Build();
        entry.Staff = staffEntity;

        var dto = entry.Adapt<PayrollEntryDto>();

        dto.StaffName.Should().Be("Alice Trainer");
        dto.StaffType.Should().Be(StaffType.Trainer);
        dto.BasePay.Should().Be(3000m);
        dto.ClassBonus.Should().Be(500m);
        dto.Deductions.Should().Be(100m);
        dto.NetPay.Should().Be(entry.NetPay);
        dto.ClassesTaught.Should().Be(10);
    }

    [Fact]
    public void MemberDto_FlattensUserNavigation()
    {
        var user = new UserBuilder()
            .WithFullName("Carlos Member")
            .WithEmail("carlos@example.com")
            .WithPhone("555-9876")
            .Build();

        var member = new MemberBuilder()
            .WithMemberCode("GM-00042")
            .WithUser(user)
            .Build();

        var dto = member.Adapt<MemberDto>();

        dto.FullName.Should().Be("Carlos Member");
        dto.Email.Should().Be("carlos@example.com");
        dto.Phone.Should().Be("555-9876");
        dto.MemberCode.Should().Be("GM-00042");
        dto.UserId.Should().Be(user.Id);
        dto.GymHouseId.Should().Be(member.GymHouseId);
        dto.Status.Should().Be(MembershipStatus.Active);
    }

    [Fact]
    public void ClassScheduleDto_ComputesAvailableSpots()
    {
        var trainer = new UserBuilder().WithFullName("Trainer Tom").Build();

        var schedule = new ClassScheduleBuilder()
            .WithMaxCapacity(20)
            .WithCurrentEnrollment(8)
            .WithClassName("Pilates")
            .WithDayOfWeek(DayOfWeek.Wednesday)
            .WithTrainer(trainer)
            .Build();

        var dto = schedule.Adapt<ClassScheduleDto>();

        dto.AvailableSpots.Should().Be(12);
        dto.MaxCapacity.Should().Be(20);
        dto.CurrentEnrollment.Should().Be(8);
        dto.TrainerName.Should().Be("Trainer Tom");
        dto.ClassName.Should().Be("Pilates");
        dto.DayOfWeek.Should().Be(DayOfWeek.Wednesday);
    }

    [Fact]
    public void TimeSlotDto_ComputesAvailableSpots()
    {
        var slot = new TimeSlotBuilder()
            .WithMaxCapacity(30)
            .WithCurrentBookings(12)
            .Build();

        var dto = slot.Adapt<TimeSlotDto>();

        dto.AvailableSpots.Should().Be(18);
        dto.MaxCapacity.Should().Be(30);
        dto.CurrentBookings.Should().Be(12);
    }

    [Fact]
    public void PayrollPeriodDto_ComputesAggregates()
    {
        var entry1 = new PayrollEntryBuilder().WithBasePay(3000m).WithClassBonus(500m).WithDeductions(100m).Build();
        var entry2 = new PayrollEntryBuilder().WithBasePay(2500m).WithClassBonus(200m).WithDeductions(50m).Build();
        // entry1.NetPay = 3000 + 500 - 100 = 3400
        // entry2.NetPay = 2500 + 200 - 50 = 2650
        // total = 6050

        var period = new PayrollPeriodBuilder()
            .WithEntries([entry1, entry2])
            .WithStatus(PayrollStatus.Draft)
            .Build();

        var dto = period.Adapt<PayrollPeriodDto>();

        dto.TotalNetPay.Should().Be(6050m);
        dto.EntryCount.Should().Be(2);
        dto.Status.Should().Be(PayrollStatus.Draft);
        dto.GymHouseId.Should().Be(period.GymHouseId);
    }

    [Fact]
    public void PayrollPeriodDetailDto_MapsEntriesAndAggregates()
    {
        var user = new UserBuilder().WithFullName("Staff One").Build();
        var staffEntity = new StaffBuilder().WithStaffType(StaffType.Reception).Build();
        staffEntity.User = user;

        var entry = new PayrollEntryBuilder().WithBasePay(2000m).WithClassBonus(0m).WithDeductions(50m).Build();
        entry.Staff = staffEntity;

        var period = new PayrollPeriodBuilder()
            .WithEntries([entry])
            .Build();

        var dto = period.Adapt<PayrollPeriodDetailDto>();

        dto.Entries.Should().HaveCount(1);
        dto.Entries[0].StaffName.Should().Be("Staff One");
        dto.Entries[0].StaffType.Should().Be(StaffType.Reception);
        dto.TotalNetPay.Should().Be(entry.NetPay);
        dto.GymHouseId.Should().Be(period.GymHouseId);
    }

    [Fact]
    public void GymHouseDto_MapsAllProperties()
    {
        var gymHouse = new GymHouseBuilder()
            .WithName("Fitness Hub")
            .WithAddress("456 Power Ave")
            .WithPhone("555-0001")
            .WithOperatingHours("6am-10pm")
            .WithHourlyCapacity(100)
            .Build();

        var dto = gymHouse.Adapt<GymHouseDto>();

        dto.Name.Should().Be("Fitness Hub");
        dto.Address.Should().Be("456 Power Ave");
        dto.Phone.Should().Be("555-0001");
        dto.OperatingHours.Should().Be("6am-10pm");
        dto.HourlyCapacity.Should().Be(100);
        dto.OwnerId.Should().Be(gymHouse.OwnerId);
        dto.Id.Should().Be(gymHouse.Id);
    }

    [Fact]
    public void SubscriptionDto_MapsAllProperties()
    {
        var start = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);

        var subscription = new SubscriptionBuilder()
            .WithType(SubscriptionType.Monthly)
            .WithStatus(SubscriptionStatus.Active)
            .WithPrice(99.99m)
            .WithStartDate(start)
            .WithEndDate(end)
            .Build();

        var dto = subscription.Adapt<SubscriptionDto>();

        dto.Id.Should().Be(subscription.Id);
        dto.MemberId.Should().Be(subscription.MemberId);
        dto.GymHouseId.Should().Be(subscription.GymHouseId);
        dto.Type.Should().Be(SubscriptionType.Monthly);
        dto.Status.Should().Be(SubscriptionStatus.Active);
        dto.Price.Should().Be(99.99m);
        dto.StartDate.Should().Be(start);
        dto.EndDate.Should().Be(end);
        dto.FrozenAt.Should().BeNull();
        dto.FrozenUntil.Should().BeNull();
    }

    [Fact]
    public void BookingDto_MapsFromBookingAndMember()
    {
        var user = new UserBuilder().WithFullName("Test Member").Build();
        var member = new MemberBuilder()
            .WithMemberCode("GM-00099")
            .WithUser(user)
            .Build();

        var booking = new BookingBuilder()
            .WithMember(member)
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        var dto = BookingMapper.ToDto(booking, member);

        dto.Id.Should().Be(booking.Id);
        dto.MemberId.Should().Be(member.Id);
        dto.GymHouseId.Should().Be(booking.GymHouseId);
        dto.Status.Should().Be(BookingStatus.Confirmed);
        dto.MemberName.Should().Be("Test Member");
        dto.MemberCode.Should().Be("GM-00099");
    }

    [Fact]
    public void NullNavigation_ReturnsDefaults()
    {
        var staff = new StaffBuilder().Build();
        // Staff.User is not set (null navigation)

        var dto = staff.Adapt<StaffDto>();

        dto.UserName.Should().Be(string.Empty);
        dto.UserEmail.Should().Be(string.Empty);
    }
}
