using System.ComponentModel.DataAnnotations;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Request model for queue status mutation from clinician workflow.
/// </summary>
public class UpdateQueueTicketStatusInput
{
    /// <summary>
    /// Gets or sets queue ticket id.
    /// </summary>
    [Range(1, long.MaxValue)]
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets target queue status.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string NewStatus { get; set; }

    /// <summary>
    /// Gets or sets optional note attached to queue event.
    /// </summary>
    [StringLength(256)]
    public string Note { get; set; }
}
