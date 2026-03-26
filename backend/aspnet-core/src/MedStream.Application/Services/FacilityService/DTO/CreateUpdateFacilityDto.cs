using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Input used to create or update a facility.
/// </summary>
public class CreateUpdateFacilityDto : IValidatableObject
{
    /// <summary>
    /// Gets or sets the facility name.
    /// </summary>
    [Required]
    [StringLength(128)]
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets the optional facility code.
    /// </summary>
    [StringLength(32)]
    public string Code { get; set; }

    /// <summary>
    /// Gets or sets the facility type.
    /// </summary>
    [StringLength(64)]
    public string FacilityType { get; set; }

    /// <summary>
    /// Gets or sets the province.
    /// </summary>
    [StringLength(64)]
    public string Province { get; set; }

    /// <summary>
    /// Gets or sets the district.
    /// </summary>
    [StringLength(64)]
    public string District { get; set; }

    /// <summary>
    /// Gets or sets the address.
    /// </summary>
    [StringLength(256)]
    public string Address { get; set; }

    /// <summary>
    /// Gets or sets whether the facility is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <inheritdoc />
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(FacilityType) && !FacilityConstants.SupportedFacilityTypes.Contains(FacilityType))
        {
            yield return new ValidationResult("Facility type must be selected from the supported list.", new[] { nameof(FacilityType) });
        }

        if (!string.IsNullOrWhiteSpace(Province) && !FacilityConstants.SupportedProvinces.Contains(Province))
        {
            yield return new ValidationResult("Province must be selected from the supported South African province list.", new[] { nameof(Province) });
        }
    }
}
