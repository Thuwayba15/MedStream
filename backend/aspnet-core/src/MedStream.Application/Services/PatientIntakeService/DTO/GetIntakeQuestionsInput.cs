using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for dynamic intake question retrieval.
/// </summary>
public class GetIntakeQuestionsInput
{
    /// <summary>
    /// Gets or sets pathway key.
    /// </summary>
    [Required]
    [StringLength(128)]
    public string PathwayKey { get; set; }

    /// <summary>
    /// Gets or sets optional primary symptom used for question ordering.
    /// </summary>
    [StringLength(128)]
    public string PrimarySymptom { get; set; }
}
