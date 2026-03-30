using System;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Result model returned after queue status update.
/// </summary>
public class UpdateQueueTicketStatusOutput
{
    /// <summary>
    /// Gets or sets queue ticket id.
    /// </summary>
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets previous queue status.
    /// </summary>
    public string OldStatus { get; set; }

    /// <summary>
    /// Gets or sets new queue status.
    /// </summary>
    public string NewStatus { get; set; }

    /// <summary>
    /// Gets or sets updated stage label.
    /// </summary>
    public string CurrentStage { get; set; }

    /// <summary>
    /// Gets or sets timestamp for status mutation.
    /// </summary>
    public DateTime ChangedAt { get; set; }

    /// <summary>
    /// Gets or sets visit id for workflow routing.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets patient user id for workflow routing.
    /// </summary>
    public long PatientUserId { get; set; }
}
