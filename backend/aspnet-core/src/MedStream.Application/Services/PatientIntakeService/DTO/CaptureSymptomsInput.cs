using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for symptom capture.
/// </summary>
public class CaptureSymptomsInput
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
}
