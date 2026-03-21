using System.ComponentModel.DataAnnotations;

namespace GymManager.Application.Common.Options;

public sealed class SeedOptions
{
    public const string SectionName = "Seed:Owner";

    [Required(AllowEmptyStrings = false, ErrorMessage = "Seed:Owner:Email is required.")]
    [EmailAddress(ErrorMessage = "Seed:Owner:Email must be a valid email address.")]
    public string Email { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Seed:Owner:Password is required.")]
    [MinLength(8, ErrorMessage = "Seed:Owner:Password must be at least 8 characters.")]
    [RegularExpression(
        @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$",
        ErrorMessage = "Seed:Owner:Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
    public string Password { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Seed:Owner:GymName is required.")]
    [MaxLength(200, ErrorMessage = "Seed:Owner:GymName must not exceed 200 characters.")]
    public string GymName { get; init; } = string.Empty;
}
