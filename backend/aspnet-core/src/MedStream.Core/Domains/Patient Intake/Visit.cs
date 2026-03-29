using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Represents a patient visit session used for intake, triage, and queue status output.
/// </summary>
public class Visit : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the ABP user id for the patient that owns this visit.
    /// </summary>
    public long PatientUserId { get; set; }

    /// <summary>
    /// Gets or sets the related facility id when known.
    /// </summary>
    public int? FacilityId { get; set; }

    /// <summary>
    /// Gets or sets the visit date and time (UTC).
    /// </summary>
    public DateTime VisitDate { get; set; }

    /// <summary>
    /// Gets or sets the visit status.
    /// </summary>
    [Required]
    [StringLength(64)]
    public string Status { get; set; }

    /// <summary>
    /// Gets or sets the pathway key used to fetch dynamic questions.
    /// </summary>
    [Required]
    [StringLength(128)]
    public string PathwayKey { get; set; }
}
