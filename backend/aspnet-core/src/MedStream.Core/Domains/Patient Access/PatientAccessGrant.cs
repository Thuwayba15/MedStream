using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientAccess;

/// <summary>
/// Explicit clinician access grant for a patient record beyond visit assignment.
/// </summary>
public class PatientAccessGrant : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the patient account user id that the grant applies to.
    /// </summary>
    public long PatientUserId { get; set; }

    /// <summary>
    /// Gets or sets the clinician user id receiving the grant.
    /// </summary>
    public long ClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets an optional visit id that motivated the grant.
    /// </summary>
    public long? VisitId { get; set; }

    /// <summary>
    /// Gets or sets an optional facility id associated with the grant.
    /// </summary>
    public int? FacilityId { get; set; }

    /// <summary>
    /// Gets or sets whether the grant is active.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Gets or sets when access was granted.
    /// </summary>
    public DateTime GrantedAt { get; set; }

    /// <summary>
    /// Gets or sets when the grant expires, when applicable.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Gets or sets the grant rationale.
    /// </summary>
    [Required]
    [StringLength(512)]
    public string Reason { get; set; }
}
