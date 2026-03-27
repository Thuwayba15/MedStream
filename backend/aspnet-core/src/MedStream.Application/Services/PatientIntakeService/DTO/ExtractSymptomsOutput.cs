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

    /// <summary>
    /// Gets or sets ranked likely pathway ids.
    /// </summary>
    public List<string> LikelyPathwayIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected pathway id used for next question retrieval.
    /// </summary>
    public string SelectedPathwayKey { get; set; }

    /// <summary>
    /// Gets or sets mapped input values inferred from free-text intake.
    /// </summary>
    public Dictionary<string, object> MappedInputValues { get; set; } = new();
}
