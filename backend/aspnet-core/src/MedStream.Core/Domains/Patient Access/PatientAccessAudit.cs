using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientAccess;

/// <summary>
/// Audit record for clinician access to a patient history/timeline view.
/// </summary>
public class PatientAccessAudit : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the patient account user id that was accessed.
    /// </summary>
    public long PatientUserId { get; set; }

    /// <summary>
    /// Gets or sets the clinician user id that accessed the patient record.
    /// </summary>
    public long ClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets an optional visit id associated with the access reason.
    /// </summary>
    public long? VisitId { get; set; }

    /// <summary>
    /// Gets or sets an optional facility id associated with the access event.
    /// </summary>
    public int? FacilityId { get; set; }

    /// <summary>
    /// Gets or sets the access type.
    /// </summary>
    [Required]
    [StringLength(64)]
    public string AccessType { get; set; }

    /// <summary>
    /// Gets or sets the reason the access was permitted.
    /// </summary>
    [Required]
    [StringLength(64)]
    public string AccessReason { get; set; }

    /// <summary>
    /// Gets or sets optional notes about the access.
    /// </summary>
    [StringLength(512)]
    public string Notes { get; set; }

    /// <summary>
    /// Gets or sets when the access occurred.
    /// </summary>
    public DateTime AccessedAt { get; set; }
}
