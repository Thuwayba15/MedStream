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
    /// Gets or sets queue status output.
    /// </summary>
    public QueueStatusDto Queue { get; set; }

    /// <summary>
    /// Gets or sets full decision-support execution summary.
    /// </summary>
    public PathwayExecutionSummaryDto Execution { get; set; } = new();
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
    /// Gets or sets queue ticket id.
    /// </summary>
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets queue number assigned for facility/date.
    /// </summary>
    public int QueueNumber { get; set; }

    /// <summary>
    /// Gets or sets queue status code.
    /// </summary>
    public string QueueStatus { get; set; }

    /// <summary>
    /// Gets or sets stage label.
    /// </summary>
    public string CurrentStage { get; set; }

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

    /// <summary>
    /// Gets or sets when patient entered queue.
    /// </summary>
    public DateTime EnteredQueueAt { get; set; }
}
