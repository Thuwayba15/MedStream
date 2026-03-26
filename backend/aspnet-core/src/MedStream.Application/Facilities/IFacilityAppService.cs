using Abp.Application.Services;
using Abp.Application.Services.Dto;
using MedStream.Facilities.Dto;
using System.Threading.Tasks;

namespace MedStream.Facilities;

/// <summary>
/// Application service contract for admin-managed facilities.
/// </summary>
public interface IFacilityAppService : IAsyncCrudAppService<FacilityDto, int, PagedFacilityResultRequestDto, CreateUpdateFacilityDto, UpdateFacilityDto>
{
    /// <summary>
    /// Sets the active state for a facility.
    /// </summary>
    Task<FacilityDto> SetActivation(SetFacilityActivationInput input);

    /// <summary>
    /// Assigns a clinician user to a facility.
    /// </summary>
    Task AssignClinician(AssignClinicianFacilityInput input);

    /// <summary>
    /// Returns all active facilities for dropdown selections.
    /// </summary>
    Task<ListResultDto<FacilityDto>> GetActiveList();
}
