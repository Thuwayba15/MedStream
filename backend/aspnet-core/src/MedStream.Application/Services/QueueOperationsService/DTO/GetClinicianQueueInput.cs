using Abp.Application.Services.Dto;
using System.Collections.Generic;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Query options for clinician queue listing.
/// </summary>
public class GetClinicianQueueInput : PagedResultRequestDto
{
    /// <summary>
    /// Gets or sets optional status filters.
    /// </summary>
    public List<string> QueueStatuses { get; set; } = new();

    /// <summary>
    /// Gets or sets optional urgency filters.
    /// </summary>
    public List<string> UrgencyLevels { get; set; } = new();

    /// <summary>
    /// Gets or sets optional search text for patient name or queue number.
    /// </summary>
    public string SearchText { get; set; }
}
