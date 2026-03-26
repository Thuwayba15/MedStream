using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using MedStream.Facilities;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Data transfer object for a managed facility.
/// </summary>
[AutoMapFrom(typeof(Facility))]
public class FacilityDto : EntityDto<int>
{
    /// <summary>
    /// Gets or sets the facility name.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets the optional facility code.
    /// </summary>
    public string Code { get; set; }

    /// <summary>
    /// Gets or sets the facility type label.
    /// </summary>
    public string FacilityType { get; set; }

    /// <summary>
    /// Gets or sets the province.
    /// </summary>
    public string Province { get; set; }

    /// <summary>
    /// Gets or sets the district.
    /// </summary>
    public string District { get; set; }

    /// <summary>
    /// Gets or sets the address.
    /// </summary>
    public string Address { get; set; }

    /// <summary>
    /// Gets or sets whether the facility is active.
    /// </summary>
    public bool IsActive { get; set; }
}
