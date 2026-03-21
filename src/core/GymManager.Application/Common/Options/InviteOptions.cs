namespace GymManager.Application.Common.Options;

public sealed class InviteOptions
{
    public const string SectionName = "App";

    /// <summary>
    /// Base URL for generated invite links sent to invitees.
    /// Example: https://app.gymmanager.com/invite
    /// </summary>
    public string InviteBaseUrl { get; init; } = "http://localhost:3000/invite";
}
