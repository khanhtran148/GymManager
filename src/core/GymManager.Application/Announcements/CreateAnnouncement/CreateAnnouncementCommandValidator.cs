using FluentValidation;

namespace GymManager.Application.Announcements.CreateAnnouncement;

public sealed class CreateAnnouncementCommandValidator : AbstractValidator<CreateAnnouncementCommand>
{
    public CreateAnnouncementCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(5000).WithMessage("Content must not exceed 5000 characters.");

        RuleFor(x => x.PublishAt)
            .Must(publishAt => publishAt >= DateTime.UtcNow.AddSeconds(-30))
            .WithMessage("PublishAt must not be in the past.");

        RuleFor(x => x.TargetAudience)
            .IsInEnum().WithMessage("TargetAudience must be a valid value.");
    }
}
