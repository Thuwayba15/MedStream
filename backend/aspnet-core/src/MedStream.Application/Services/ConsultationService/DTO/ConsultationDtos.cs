#nullable enable
using System;
using System.Collections.Generic;

namespace MedStream.Consultation.Dto;

public class GetConsultationWorkspaceInput
{
    public long VisitId { get; set; }

    public long? QueueTicketId { get; set; }
}

public class SaveVitalsInput
{
    public long VisitId { get; set; }

    public string Phase { get; set; } = string.Empty;

    public int? BloodPressureSystolic { get; set; }

    public int? BloodPressureDiastolic { get; set; }

    public int? HeartRate { get; set; }

    public int? RespiratoryRate { get; set; }

    public decimal? TemperatureCelsius { get; set; }

    public int? OxygenSaturation { get; set; }

    public decimal? BloodGlucose { get; set; }

    public decimal? WeightKg { get; set; }
}

public class SaveEncounterNoteDraftInput
{
    public long VisitId { get; set; }

    public string? Subjective { get; set; }

    public string? Objective { get; set; }

    public string? Assessment { get; set; }

    public string? Plan { get; set; }

    public string? ClinicianTimelineSummary { get; set; }

    public string? PatientTimelineSummary { get; set; }
}

public class AttachConsultationTranscriptInput
{
    public long VisitId { get; set; }

    public string InputMode { get; set; } = string.Empty;

    public string RawTranscriptText { get; set; } = string.Empty;

    public string? TranslatedTranscriptText { get; set; }

    public string? LanguageDetected { get; set; }
}

public class GenerateConsultationDraftInput
{
    public long VisitId { get; set; }
}

public class FinalizeEncounterNoteInput
{
    public long VisitId { get; set; }

    public string ClinicianTimelineSummary { get; set; } = string.Empty;

    public string PatientTimelineSummary { get; set; } = string.Empty;
}

public class ConsultationWorkspaceDto
{
    public long VisitId { get; set; }

    public long? QueueTicketId { get; set; }

    public string VisitStatus { get; set; } = string.Empty;

    public ConsultationPatientContextDto PatientContext { get; set; } = new();

    public EncounterNoteDto EncounterNote { get; set; } = new();

    public ConsultationVitalSignsDto? LatestVitals { get; set; }

    public List<ConsultationTranscriptDto> Transcripts { get; set; } = new();
}

public class ConsultationPatientContextDto
{
    public long PatientUserId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public int? FacilityId { get; set; }

    public string ChiefComplaint { get; set; } = string.Empty;

    public string SubjectiveSummary { get; set; } = string.Empty;

    public string UrgencyLevel { get; set; } = string.Empty;

    public string QueueStatus { get; set; } = string.Empty;

    public DateTime VisitDate { get; set; }
}

public class EncounterNoteDto
{
    public long Id { get; set; }

    public long VisitId { get; set; }

    public string IntakeSubjective { get; set; } = string.Empty;

    public string Subjective { get; set; } = string.Empty;

    public string Objective { get; set; } = string.Empty;

    public string Assessment { get; set; } = string.Empty;

    public string Plan { get; set; } = string.Empty;

    public string ClinicianTimelineSummary { get; set; } = string.Empty;

    public string PatientTimelineSummary { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime? FinalizedAt { get; set; }
}

public class ConsultationVitalSignsDto
{
    public long Id { get; set; }

    public long VisitId { get; set; }

    public string Phase { get; set; } = string.Empty;

    public int? BloodPressureSystolic { get; set; }

    public int? BloodPressureDiastolic { get; set; }

    public int? HeartRate { get; set; }

    public int? RespiratoryRate { get; set; }

    public decimal? TemperatureCelsius { get; set; }

    public int? OxygenSaturation { get; set; }

    public decimal? BloodGlucose { get; set; }

    public decimal? WeightKg { get; set; }

    public bool IsLatest { get; set; }

    public DateTime RecordedAt { get; set; }
}

public class ConsultationTranscriptDto
{
    public long Id { get; set; }

    public long EncounterNoteId { get; set; }

    public string InputMode { get; set; } = string.Empty;

    public string RawTranscriptText { get; set; } = string.Empty;

    public string? TranslatedTranscriptText { get; set; }

    public string? LanguageDetected { get; set; }

    public DateTime CapturedAt { get; set; }
}

public class ConsultationAiDraftDto
{
    public long VisitId { get; set; }

    public long EncounterNoteId { get; set; }

    public string Source { get; set; } = string.Empty;

    public DateTime GeneratedAt { get; set; }

    public string? Subjective { get; set; }

    public string? Assessment { get; set; }

    public string? Plan { get; set; }

    public string Summary { get; set; } = string.Empty;
}
