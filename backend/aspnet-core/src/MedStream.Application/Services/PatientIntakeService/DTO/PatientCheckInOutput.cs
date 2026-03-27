using System;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload returned when a patient check-in session starts.
/// </summary>
public class PatientCheckInOutput
{
    /// <summary>
    /// Gets or sets the visit id for this intake session.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets display facility name.
    /// </summary>
    public string FacilityName { get; set; }

    /// <summary>
    /// Gets or sets check-in timestamp in UTC.
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// Gets or sets pathway key used by dynamic question lookup.
    /// </summary>
    public string PathwayKey { get; set; }
}
