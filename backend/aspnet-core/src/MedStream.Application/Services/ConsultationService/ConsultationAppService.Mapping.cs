#nullable enable
using Abp.UI;
using MedStream.Consultation.Dto;
using MedStream.PatientIntake;
using System.Collections.Generic;

namespace MedStream.Consultation;

public partial class ConsultationAppService
{
    private static EncounterNoteDto MapEncounterNote(EncounterNote note)
    {
        return new EncounterNoteDto
        {
            Id = note.Id,
            VisitId = note.VisitId,
            IntakeSubjective = note.IntakeSubjective ?? string.Empty,
            Subjective = note.Subjective ?? string.Empty,
            Objective = note.Objective ?? string.Empty,
            Assessment = note.Assessment ?? string.Empty,
            Plan = note.Plan ?? string.Empty,
            ClinicianTimelineSummary = note.ClinicianTimelineSummary ?? string.Empty,
            PatientTimelineSummary = note.PatientTimelineSummary ?? string.Empty,
            Status = note.Status ?? string.Empty,
            FinalizedAt = note.FinalizedAt
        };
    }

    private static ConsultationVitalSignsDto MapVitalSigns(VitalSigns vitals)
    {
        return new ConsultationVitalSignsDto
        {
            Id = vitals.Id,
            VisitId = vitals.VisitId,
            Phase = vitals.Phase,
            BloodPressureSystolic = vitals.BloodPressureSystolic,
            BloodPressureDiastolic = vitals.BloodPressureDiastolic,
            HeartRate = vitals.HeartRate,
            RespiratoryRate = vitals.RespiratoryRate,
            TemperatureCelsius = vitals.TemperatureCelsius,
            OxygenSaturation = vitals.OxygenSaturation,
            BloodGlucose = vitals.BloodGlucose,
            WeightKg = vitals.WeightKg,
            IsLatest = vitals.IsLatest,
            RecordedAt = vitals.RecordedAt
        };
    }

    private static ConsultationTranscriptDto MapTranscript(ConsultationTranscript transcript)
    {
        return new ConsultationTranscriptDto
        {
            Id = transcript.Id,
            EncounterNoteId = transcript.EncounterNoteId,
            InputMode = transcript.InputMode,
            RawTranscriptText = transcript.RawTranscriptText,
            TranslatedTranscriptText = transcript.TranslatedTranscriptText,
            LanguageDetected = transcript.LanguageDetected,
            CapturedAt = transcript.CapturedAt
        };
    }

    private static string NormalizeVitalPhase(string phase)
    {
        return phase.Trim().ToLowerInvariant() switch
        {
            PatientIntakeConstants.VitalSignsPhaseTriage => PatientIntakeConstants.VitalSignsPhaseTriage,
            PatientIntakeConstants.VitalSignsPhaseConsultation => PatientIntakeConstants.VitalSignsPhaseConsultation,
            _ => throw new UserFriendlyException("Unsupported vitals phase.")
        };
    }

    private static string NormalizeTranscriptInputMode(string inputMode)
    {
        return inputMode.Trim().ToLowerInvariant() switch
        {
            PatientIntakeConstants.TranscriptInputModeTyped => PatientIntakeConstants.TranscriptInputModeTyped,
            PatientIntakeConstants.TranscriptInputModeAudioUpload => PatientIntakeConstants.TranscriptInputModeAudioUpload,
            _ => throw new UserFriendlyException("Unsupported transcript input mode.")
        };
    }

    private static string SanitizeSection(string value)
    {
        var safeValue = (value ?? string.Empty).Trim();
        return safeValue.Length <= MaxEncounterSectionLength ? safeValue : safeValue[..MaxEncounterSectionLength];
    }

    private static string SanitizeTimelineSummary(string value)
    {
        var safeValue = (value ?? string.Empty).Trim();
        return safeValue.Length <= MaxTimelineSummaryLength ? safeValue : safeValue[..MaxTimelineSummaryLength];
    }

    private static string BuildVitalsSummary(VitalSigns? vitals)
    {
        if (vitals == null)
        {
            return string.Empty;
        }

        var parts = new List<string>();
        if (vitals.BloodPressureSystolic.HasValue || vitals.BloodPressureDiastolic.HasValue)
        {
            parts.Add($"BP {vitals.BloodPressureSystolic?.ToString() ?? "?"}/{vitals.BloodPressureDiastolic?.ToString() ?? "?"}");
        }

        if (vitals.HeartRate.HasValue) parts.Add($"HR {vitals.HeartRate.Value} bpm");
        if (vitals.RespiratoryRate.HasValue) parts.Add($"RR {vitals.RespiratoryRate.Value}/min");
        if (vitals.TemperatureCelsius.HasValue) parts.Add($"Temp {vitals.TemperatureCelsius.Value:0.0} C");
        if (vitals.OxygenSaturation.HasValue) parts.Add($"SpO2 {vitals.OxygenSaturation.Value}%");
        if (vitals.BloodGlucose.HasValue) parts.Add($"Glucose {vitals.BloodGlucose.Value:0.##}");
        if (vitals.WeightKg.HasValue) parts.Add($"Weight {vitals.WeightKg.Value:0.##} kg");

        return string.Join(", ", parts);
    }
}
