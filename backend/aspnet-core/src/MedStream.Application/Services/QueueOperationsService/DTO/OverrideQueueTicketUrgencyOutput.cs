namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Result model returned after clinician urgency override.
/// </summary>
public class OverrideQueueTicketUrgencyOutput
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
    /// Gets or sets previous urgency level.
    /// </summary>
    public string PreviousUrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets updated urgency level.
    /// </summary>
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets recalculated priority score.
    /// </summary>
    public decimal PriorityScore { get; set; }
}
