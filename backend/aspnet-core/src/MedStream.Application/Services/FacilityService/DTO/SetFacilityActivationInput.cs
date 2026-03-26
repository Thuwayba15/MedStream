using Abp.Application.Services.Dto;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Input used to set facility activation state.
/// </summary>
public class SetFacilityActivationInput : EntityDto<int>
{
    /// <summary>
    /// Gets or sets the target active state.
    /// </summary>
    [Required]
    public bool IsActive { get; set; }
}
