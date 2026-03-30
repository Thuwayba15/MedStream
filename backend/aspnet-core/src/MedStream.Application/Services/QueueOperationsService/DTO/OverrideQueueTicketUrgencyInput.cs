using System.ComponentModel.DataAnnotations;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Request model for clinician urgency override on a queue ticket.
/// </summary>
public class OverrideQueueTicketUrgencyInput
{
    /// <summary>
    /// Gets or sets queue ticket id.
    /// </summary>
    [Range(1, long.MaxValue)]
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets override urgency level.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets optional rationale for the urgency override.
    /// </summary>
    [StringLength(256)]
    public string Note { get; set; }
}
