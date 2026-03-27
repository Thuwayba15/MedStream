using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for early urgent-check execution in the intake flow.
/// </summary>
public class UrgentCheckInput
{
    /// <summary>
    /// Gets or sets visit id.
    /// </summary>
    [Required]
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets selected pathway key from extraction stage.
    /// </summary>
    [Required]
    [StringLength(128)]
    public string PathwayKey { get; set; }

    /// <summary>
    /// Gets or sets intake mode from extraction stage.
    /// </summary>
    [StringLength(32)]
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets patient free-text complaint.
    /// </summary>
    [StringLength(4000)]
    public string FreeText { get; set; }

    /// <summary>
    /// Gets or sets selected symptom chips.
    /// </summary>
    public List<string> SelectedSymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extracted primary symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets APC summary ids selected during fallback retrieval.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets current urgent-check answers.
    /// </summary>
    public Dictionary<string, object> Answers { get; set; } = new();
}
