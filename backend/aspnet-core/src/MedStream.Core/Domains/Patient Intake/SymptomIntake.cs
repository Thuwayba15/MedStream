using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Captures symptom input for a visit, including free text and extracted symptom summaries.
/// </summary>
public class SymptomIntake : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the related visit id.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets the free-text symptom description entered by the patient.
    /// </summary>
    [Required]
    [StringLength(4000)]
    public string FreeTextComplaint { get; set; }

    /// <summary>
    /// Gets or sets serialized selected symptom chips.
    /// </summary>
    [StringLength(2000)]
    public string SelectedSymptoms { get; set; }

    /// <summary>
    /// Gets or sets serialized extracted primary symptoms.
    /// </summary>
    [StringLength(2000)]
    public string ExtractedPrimarySymptoms { get; set; }

    /// <summary>
    /// Gets or sets extraction source metadata.
    /// </summary>
    [StringLength(64)]
    public string ExtractionSource { get; set; }

    /// <summary>
    /// Gets or sets serialized mapped pathway input values inferred during extraction.
    /// </summary>
    [StringLength(4000)]
    public string MappedInputValues { get; set; }

    /// <summary>
    /// Gets or sets when symptom submission was captured.
    /// </summary>
    public DateTime SubmittedAt { get; set; }
}
