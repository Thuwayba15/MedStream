using System.Collections.Generic;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Paged clinician queue response with dashboard metrics.
/// </summary>
public class ClinicianQueueDashboardDto
{
    /// <summary>
    /// Gets or sets the filtered total count.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Gets or sets the current queue page rows.
    /// </summary>
    public List<ClinicianQueueItemDto> Items { get; set; } = new();

    /// <summary>
    /// Gets or sets clinician queue summary cards.
    /// </summary>
    public ClinicianQueueSummaryDto Summary { get; set; } = new();
}
