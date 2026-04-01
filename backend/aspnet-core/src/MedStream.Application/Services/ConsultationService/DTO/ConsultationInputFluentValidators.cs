using FluentValidation;
using MedStream.PatientIntake;
using System;
using System.Linq;

namespace MedStream.Consultation.Dto;

public class GetConsultationWorkspaceInputFluentValidator : AbstractValidator<GetConsultationWorkspaceInput>
{
    public GetConsultationWorkspaceInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);
        RuleFor(x => x.QueueTicketId).GreaterThan(0).When(x => x.QueueTicketId.HasValue);
    }
}

public class SaveVitalsInputFluentValidator : AbstractValidator<SaveVitalsInput>
{
    private static readonly string[] AllowedPhases =
    {
        PatientIntakeConstants.VitalSignsPhaseTriage,
        PatientIntakeConstants.VitalSignsPhaseConsultation
    };

    public SaveVitalsInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);

        RuleFor(x => x.Phase)
            .NotEmpty()
            .Must(value => AllowedPhases.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Vitals phase must be triage or consultation.");

        RuleFor(x => x)
            .Must(HasAtLeastOneVital)
            .WithMessage("At least one vital sign value is required.");
    }

    private static bool HasAtLeastOneVital(SaveVitalsInput input)
    {
        return input.BloodPressureSystolic.HasValue
               || input.BloodPressureDiastolic.HasValue
               || input.HeartRate.HasValue
               || input.RespiratoryRate.HasValue
               || input.TemperatureCelsius.HasValue
               || input.OxygenSaturation.HasValue
               || input.BloodGlucose.HasValue
               || input.WeightKg.HasValue;
    }
}

public class SaveEncounterNoteDraftInputFluentValidator : AbstractValidator<SaveEncounterNoteDraftInput>
{
    public SaveEncounterNoteDraftInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);
        RuleFor(x => x.ClinicianTimelineSummary)
            .MaximumLength(EncounterNote.MaxTimelineSummaryLength)
            .When(x => x.ClinicianTimelineSummary != null);
        RuleFor(x => x.PatientTimelineSummary)
            .MaximumLength(EncounterNote.MaxTimelineSummaryLength)
            .When(x => x.PatientTimelineSummary != null);
    }
}

public class AttachConsultationTranscriptInputFluentValidator : AbstractValidator<AttachConsultationTranscriptInput>
{
    private const int MaxEncounterSectionLength = 8000;
    private static readonly string[] AllowedModes =
    {
        PatientIntakeConstants.TranscriptInputModeTyped,
        PatientIntakeConstants.TranscriptInputModeAudioUpload
    };

    public AttachConsultationTranscriptInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);

        RuleFor(x => x.InputMode)
            .NotEmpty()
            .Must(value => AllowedModes.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Transcript input mode must be typed or audio_upload.");

        RuleFor(x => x.RawTranscriptText)
            .NotEmpty()
            .MaximumLength(MaxEncounterSectionLength);
    }
}

public class GenerateConsultationDraftInputFluentValidator : AbstractValidator<GenerateConsultationDraftInput>
{
    public GenerateConsultationDraftInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);
    }
}

public class FinalizeEncounterNoteInputFluentValidator : AbstractValidator<FinalizeEncounterNoteInput>
{
    public FinalizeEncounterNoteInputFluentValidator()
    {
        RuleFor(x => x.VisitId).GreaterThan(0);
        RuleFor(x => x.ClinicianTimelineSummary)
            .NotEmpty()
            .MaximumLength(EncounterNote.MaxTimelineSummaryLength);
        RuleFor(x => x.PatientTimelineSummary)
            .NotEmpty()
            .MaximumLength(EncounterNote.MaxTimelineSummaryLength);
    }
}
