using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

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

    /// <summary>
    /// Gets or sets optional execution stage id. Defaults to patient intake.
    /// </summary>
    [StringLength(64)]
    public string StageId { get; set; }

    /// <summary>
    /// Gets or sets optional audience role (patient/clinician). Defaults to patient.
    /// </summary>
    [StringLength(32)]
    public string Audience { get; set; }

    /// <summary>
    /// Gets or sets optional known answers for condition-aware question filtering.
    /// </summary>
    public Dictionary<string, object> Answers { get; set; } = new();

    /// <summary>
    /// Gets or sets optional clinician observations for condition-aware question filtering.
    /// </summary>
    public Dictionary<string, object> Observations { get; set; } = new();
}
