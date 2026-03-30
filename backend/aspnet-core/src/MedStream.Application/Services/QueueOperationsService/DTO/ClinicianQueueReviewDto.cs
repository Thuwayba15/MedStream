using System;
using System.Collections.Generic;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Detailed queue item payload used by clinician triage review.
/// </summary>
public class ClinicianQueueReviewDto
{
    /// <summary>
    /// Gets or sets queue ticket id.
    /// </summary>
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets visit id.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets patient user id.
    /// </summary>
    public long PatientUserId { get; set; }

    /// <summary>
    /// Gets or sets patient display name.
    /// </summary>
    public string PatientName { get; set; }

    /// <summary>
    /// Gets or sets queue number.
    /// </summary>
    public int QueueNumber { get; set; }

    /// <summary>
    /// Gets or sets queue status.
    /// </summary>
    public string QueueStatus { get; set; }

    /// <summary>
    /// Gets or sets queue current stage.
    /// </summary>
    public string CurrentStage { get; set; }

    /// <summary>
    /// Gets or sets queue waiting minutes.
    /// </summary>
    public int WaitingMinutes { get; set; }

    /// <summary>
    /// Gets or sets queue entered timestamp.
    /// </summary>
    public DateTime EnteredQueueAt { get; set; }

    /// <summary>
    /// Gets or sets urgency level.
    /// </summary>
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets clinician-only priority score.
    /// </summary>
    public decimal PriorityScore { get; set; }

    /// <summary>
    /// Gets or sets triage explanation.
    /// </summary>
    public string TriageExplanation { get; set; }

    /// <summary>
    /// Gets or sets triage red flags.
    /// </summary>
    public List<string> RedFlags { get; set; } = new();

    /// <summary>
    /// Gets or sets clinician-friendly reasoning items behind the triage result.
    /// </summary>
    public List<string> Reasoning { get; set; } = new();

    /// <summary>
    /// Gets or sets patient chief complaint.
    /// </summary>
    public string ChiefComplaint { get; set; }

    /// <summary>
    /// Gets or sets selected symptom chips.
    /// </summary>
    public List<string> SelectedSymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extracted primary symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets subjective summary for clinician handoff.
    /// </summary>
    public string SubjectiveSummary { get; set; }

    /// <summary>
    /// Gets or sets clinician-facing intake summary text.
    /// </summary>
    public string ClinicianSummary { get; set; }

    /// <summary>
    /// Gets or sets consultation route path for this visit.
    /// </summary>
    public string ConsultationPath { get; set; }

    /// <summary>
    /// Gets or sets patient history route path for this patient.
    /// </summary>
    public string PatientHistoryPath { get; set; }
}
