using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for dynamic intake question retrieval.
/// </summary>
public class GetIntakeQuestionsInput
{
    /// <summary>
    /// Gets or sets visit id for patient-owned question retrieval.
    /// </summary>
    public long? VisitId { get; set; }

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
    /// Gets or sets current free-text complaint for fallback prompt generation.
    /// </summary>
    [StringLength(4000)]
    public string FreeText { get; set; }

    /// <summary>
    /// Gets or sets selected symptom chips from intake UI.
    /// </summary>
    public List<string> SelectedSymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extracted primary symptoms for fallback question generation.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets fallback summary ids from extraction stage.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets whether questions should be generated in APC fallback mode.
    /// </summary>
    public bool UseApcFallback { get; set; }

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
