using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Stores the single evolving SOAP note attached to a visit.
/// </summary>
public class EncounterNote : FullAuditedEntity<long>, IMustHaveTenant
{
    public const int MaxTimelineSummaryLength = 2000;

    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the related visit id.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets clinician user id that created the note.
    /// </summary>
    public long CreatedByClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets the intake-seeded subjective baseline.
    /// </summary>
    [StringLength(8000)]
    public string IntakeSubjective { get; set; }

    /// <summary>
    /// Gets or sets the current editable subjective section.
    /// </summary>
    [StringLength(8000)]
    public string Subjective { get; set; }

    /// <summary>
    /// Gets or sets the current editable objective section.
    /// </summary>
    [StringLength(8000)]
    public string Objective { get; set; }

    /// <summary>
    /// Gets or sets the current editable assessment section.
    /// </summary>
    [StringLength(8000)]
    public string Assessment { get; set; }

    /// <summary>
    /// Gets or sets the current editable plan section.
    /// </summary>
    [StringLength(8000)]
    public string Plan { get; set; }

    /// <summary>
    /// Gets or sets the clinician-facing finalized summary used in longitudinal history.
    /// </summary>
    [StringLength(MaxTimelineSummaryLength)]
    public string ClinicianTimelineSummary { get; set; }

    /// <summary>
    /// Gets or sets the patient-facing finalized summary used in longitudinal history.
    /// </summary>
    [StringLength(MaxTimelineSummaryLength)]
    public string PatientTimelineSummary { get; set; }

    /// <summary>
    /// Gets or sets encounter note lifecycle status.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string Status { get; set; }

    /// <summary>
    /// Gets or sets when the note was finalized.
    /// </summary>
    public DateTime? FinalizedAt { get; set; }
}
