namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Request payload used to start a patient check-in session.
/// </summary>
public class PatientCheckInInput
{
    /// <summary>
    /// Gets or sets the active facility selected by the patient.
    /// </summary>
    public int SelectedFacilityId { get; set; }
}
