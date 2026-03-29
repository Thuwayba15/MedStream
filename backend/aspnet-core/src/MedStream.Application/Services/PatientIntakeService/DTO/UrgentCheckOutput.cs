using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Output payload for urgent-check stage.
/// </summary>
public class UrgentCheckOutput
{
    /// <summary>
    /// Gets or sets ordered urgent-check questions.
    /// </summary>
    public List<IntakeQuestionDto> QuestionSet { get; set; } = new();

    /// <summary>
    /// Gets or sets whether urgent mode was triggered.
    /// </summary>
    public bool IsUrgent { get; set; }

    /// <summary>
    /// Gets or sets whether flow should fast-track to triage/status.
    /// </summary>
    public bool ShouldFastTrack { get; set; }

    /// <summary>
    /// Gets or sets urgent trigger reasons.
    /// </summary>
    public List<string> TriggerReasons { get; set; } = new();

    /// <summary>
    /// Gets or sets intake mode after urgent-check evaluation.
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets APC summary ids used by fallback routing.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets patient-facing urgent check summary.
    /// </summary>
    public string Message { get; set; }
}
