using System.ComponentModel.DataAnnotations;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Input used to assign a clinician user to a facility.
/// </summary>
public class AssignClinicianFacilityInput
{
    /// <summary>
    /// Gets or sets the clinician user id.
    /// </summary>
    [Range(1, long.MaxValue)]
    public long ClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets the target facility id.
    /// </summary>
    [Range(1, int.MaxValue)]
    public int FacilityId { get; set; }
}
