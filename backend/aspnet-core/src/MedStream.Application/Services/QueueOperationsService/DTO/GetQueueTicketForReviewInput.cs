using Abp.Application.Services.Dto;

namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Request model for clinician triage review details.
/// </summary>
public class GetQueueTicketForReviewInput : EntityDto<long>
{
}
