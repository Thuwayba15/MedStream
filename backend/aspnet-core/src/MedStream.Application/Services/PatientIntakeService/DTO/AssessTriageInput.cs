using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for triage assessment.
/// </summary>
public class AssessTriageInput
{
    /// <summary>
    /// Gets or sets visit id.
    /// </summary>
    [Required]
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets free-text complaint.
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
    /// Gets or sets dynamic question answers keyed by question key.
    /// </summary>
    public Dictionary<string, object> Answers { get; set; } = new();

    /// <summary>
    /// Gets or sets clinician objective observations keyed by input id.
    /// </summary>
    public Dictionary<string, object> Observations { get; set; } = new();
}
