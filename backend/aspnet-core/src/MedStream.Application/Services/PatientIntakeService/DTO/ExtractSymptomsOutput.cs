using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload for extracted primary symptoms.
/// </summary>
public class ExtractSymptomsOutput
{
    /// <summary>
    /// Gets or sets top extracted symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extraction source metadata.
    /// </summary>
    public string ExtractionSource { get; set; }
}
