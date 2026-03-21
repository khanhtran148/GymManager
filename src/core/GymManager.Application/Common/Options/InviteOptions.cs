using System.ComponentModel.DataAnnotations;

namespace GymManager.Application.Common.Options;

public sealed class InviteOptions
{
    public const string SectionName = "App";

    /// <summary>
    /// Base URL for generated invite links sent to invitees.
    /// Example: https://app.gymmanager.com/invite
    /// Must be explicitly configured — no default is provided to prevent accidental
    /// token leakage over plain HTTP in production environments.
    /// </summary>
    [Required(AllowEmptyStrings = false, ErrorMessage = "App:InviteBaseUrl is required.")]
    [Url(ErrorMessage = "App:InviteBaseUrl must be a valid URL.")]
    public string InviteBaseUrl { get; init; } = string.Empty;
}
