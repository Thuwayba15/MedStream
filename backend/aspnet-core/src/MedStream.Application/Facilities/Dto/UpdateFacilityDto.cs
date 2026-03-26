using Abp.Application.Services.Dto;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Input used to update an existing facility.
/// </summary>
public class UpdateFacilityDto : CreateUpdateFacilityDto, IEntityDto<int>
{
    /// <summary>
    /// Gets or sets the facility identifier.
    /// </summary>
    public int Id { get; set; }
}
