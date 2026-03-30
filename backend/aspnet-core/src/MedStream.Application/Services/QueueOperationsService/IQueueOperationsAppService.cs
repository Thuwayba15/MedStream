using Abp.Application.Services;
using Abp.Application.Services.Dto;
using MedStream.QueueOperations.Dto;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Clinician-facing queue read operations.
/// </summary>
public interface IQueueOperationsAppService : IApplicationService
{
    /// <summary>
    /// Returns prioritized queue rows for the current clinician facility.
    /// </summary>
    Task<PagedResultDto<ClinicianQueueItemDto>> GetClinicianQueue(GetClinicianQueueInput input);

    /// <summary>
    /// Returns detailed queue + triage + intake context for clinician review.
    /// </summary>
    Task<ClinicianQueueReviewDto> GetQueueTicketForReview(GetQueueTicketForReviewInput input);

    /// <summary>
    /// Updates queue status for clinician operational flow.
    /// </summary>
    [HttpPut]
    Task<UpdateQueueTicketStatusOutput> UpdateQueueTicketStatus(UpdateQueueTicketStatusInput input);

    /// <summary>
    /// Overrides urgency for clinician review flow.
    /// </summary>
    [HttpPost]
    Task<OverrideQueueTicketUrgencyOutput> OverrideQueueTicketUrgency(OverrideQueueTicketUrgencyInput input);
}
