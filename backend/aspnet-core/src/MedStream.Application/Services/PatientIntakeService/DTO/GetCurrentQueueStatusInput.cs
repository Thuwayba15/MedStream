namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Request model for reading the current patient's queue status for a visit.
/// </summary>
public class GetCurrentQueueStatusInput
{
    /// <summary>
    /// Gets or sets visit id.
    /// </summary>
    public long VisitId { get; set; }
}
