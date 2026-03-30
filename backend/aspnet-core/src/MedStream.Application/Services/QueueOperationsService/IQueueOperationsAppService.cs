using Abp.Application.Services;
using Abp.Application.Services.Dto;
using MedStream.QueueOperations.Dto;
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
}
