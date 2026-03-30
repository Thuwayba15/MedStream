using System;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Queue row projection returned to clinician clients.
/// </summary>
public class ClinicianQueueItemDto
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
    /// Gets or sets current stage label.
    /// </summary>
    public string CurrentStage { get; set; }

    /// <summary>
    /// Gets or sets urgency level.
    /// </summary>
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets triage priority score.
    /// </summary>
    public decimal PriorityScore { get; set; }

    /// <summary>
    /// Gets or sets queue entry timestamp.
    /// </summary>
    public DateTime EnteredQueueAt { get; set; }

    /// <summary>
    /// Gets or sets queue waiting duration in minutes.
    /// </summary>
    public int WaitingMinutes { get; set; }

    /// <summary>
    /// Gets or sets whether ticket is active.
    /// </summary>
    public bool IsActive { get; set; }
}
