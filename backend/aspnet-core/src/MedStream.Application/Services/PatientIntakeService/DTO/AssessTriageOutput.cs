using System;
using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload for triage assessment.
/// </summary>
public class AssessTriageOutput
{
    /// <summary>
    /// Gets or sets triage result.
    /// </summary>
    public TriageResultDto Triage { get; set; }

    /// <summary>
    /// Gets or sets queue placeholder output.
    /// </summary>
    public QueueStatusDto Queue { get; set; }
}

/// <summary>
/// Triage result details.
/// </summary>
public class TriageResultDto
{
    /// <summary>
    /// Gets or sets urgency label.
    /// </summary>
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets priority score.
    /// </summary>
    public decimal PriorityScore { get; set; }

    /// <summary>
    /// Gets or sets explanation text.
    /// </summary>
    public string Explanation { get; set; }

    /// <summary>
    /// Gets or sets red flag labels.
    /// </summary>
    public List<string> RedFlags { get; set; } = new();
}

/// <summary>
/// Queue status details.
/// </summary>
public class QueueStatusDto
{
    /// <summary>
    /// Gets or sets whether queue position assignment is pending.
    /// </summary>
    public bool PositionPending { get; set; }

    /// <summary>
    /// Gets or sets queue status message.
    /// </summary>
    public string Message { get; set; }

    /// <summary>
    /// Gets or sets queue status update timestamp.
    /// </summary>
    public DateTime LastUpdatedAt { get; set; }
}
