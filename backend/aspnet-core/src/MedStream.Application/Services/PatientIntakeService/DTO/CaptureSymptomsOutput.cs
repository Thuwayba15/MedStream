using System;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload for symptom capture.
/// </summary>
public class CaptureSymptomsOutput
{
    /// <summary>
    /// Gets or sets symptom capture timestamp in UTC.
    /// </summary>
    public DateTime CapturedAt { get; set; }
}
