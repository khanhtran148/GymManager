using GymManager.Domain.Entities;

namespace GymManager.Tests.Common.Builders;

public sealed class GymHouseBuilder
{
    private string _name = "Test Gym";
    private string _address = "123 Fitness Street";
    private string? _phone = "555-1234";
    private string? _operatingHours = null;
    private int _hourlyCapacity = 50;
    private Guid _ownerId = Guid.NewGuid();

    public GymHouseBuilder WithName(string name) { _name = name; return this; }
    public GymHouseBuilder WithAddress(string address) { _address = address; return this; }
    public GymHouseBuilder WithPhone(string? phone) { _phone = phone; return this; }
    public GymHouseBuilder WithOperatingHours(string? hours) { _operatingHours = hours; return this; }
    public GymHouseBuilder WithHourlyCapacity(int capacity) { _hourlyCapacity = capacity; return this; }
    public GymHouseBuilder WithOwnerId(Guid ownerId) { _ownerId = ownerId; return this; }

    public GymHouse Build() => new()
    {
        Name = _name,
        Address = _address,
        Phone = _phone,
        OperatingHours = _operatingHours,
        HourlyCapacity = _hourlyCapacity,
        OwnerId = _ownerId
    };
}
