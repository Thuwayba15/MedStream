#nullable enable
using System;
using System.Collections.Generic;

namespace MedStream.PatientTimeline.Dto;

/// <summary>
/// Clinician history request by patient account id.
/// </summary>
public class GetPatientTimelineInput
{
    public long PatientUserId { get; set; }
}

/// <summary>
/// Aggregated patient timeline payload for clinician or patient self-history.
/// </summary>
public class PatientTimelineDto
{
    public bool IsClinicianView { get; set; }

    public PatientTimelinePatientDto Patient { get; set; } = new();

    public List<PatientTimelineVisitDto> Visits { get; set; } = new();

    public List<PatientTimelineEventDto> Timeline { get; set; } = new();

    public List<PatientTimelineRecordDto> Conditions { get; set; } = new();

    public List<PatientTimelineRecordDto> Allergies { get; set; } = new();

    public List<PatientTimelineRecordDto> Medications { get; set; } = new();
}

/// <summary>
/// Patient header summary for the timeline.
/// </summary>
public class PatientTimelinePatientDto
{
    public long PatientUserId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public string? IdNumber { get; set; }

    public int TotalVisits { get; set; }

    public DateTime? MostRecentVisitAt { get; set; }
}

/// <summary>
/// Visit-level summary card data for the patient timeline.
/// </summary>
public class PatientTimelineVisitDto
{
    public long VisitId { get; set; }

    public DateTime VisitDate { get; set; }

    public string VisitStatus { get; set; } = string.Empty;

    public int? FacilityId { get; set; }

    public string FacilityName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string ChiefComplaint { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string SummarySource { get; set; } = string.Empty;

    public string? UrgencyLevel { get; set; }

    public string? QueueStatus { get; set; }

    public string? ClinicianName { get; set; }

    public DateTime? FinalizedAt { get; set; }
}

/// <summary>
/// Chronological event item within the patient timeline.
/// </summary>
public class PatientTimelineEventDto
{
    public string EventId { get; set; } = string.Empty;

    public long VisitId { get; set; }

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public DateTime OccurredAt { get; set; }

    public int? FacilityId { get; set; }

    public string FacilityName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? RecordedByName { get; set; }

    public string Provenance { get; set; } = string.Empty;

    public string? UrgencyLevel { get; set; }
}

/// <summary>
/// Longitudinal record placeholder for patient-scoped conditions, allergies, or medications.
/// </summary>
public class PatientTimelineRecordDto
{
    public string Title { get; set; } = string.Empty;

    public string Detail { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
}
