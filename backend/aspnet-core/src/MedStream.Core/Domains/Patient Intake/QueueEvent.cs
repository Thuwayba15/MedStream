using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Immutable audit entry for queue ticket changes.
/// </summary>
public class QueueEvent : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets queue ticket id.
    /// </summary>
    public long QueueTicketId { get; set; }

    /// <summary>
    /// Gets or sets queue event type.
    /// </summary>
    [Required]
    [StringLength(64)]
    public string EventType { get; set; }

    /// <summary>
    /// Gets or sets status before event.
    /// </summary>
    [StringLength(32)]
    public string OldStatus { get; set; }

    /// <summary>
    /// Gets or sets status after event.
    /// </summary>
    [StringLength(32)]
    public string NewStatus { get; set; }

    /// <summary>
    /// Gets or sets clinician user id responsible for change.
    /// </summary>
    public long? ChangedByClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets optional event notes.
    /// </summary>
    [StringLength(2000)]
    public string Notes { get; set; }

    /// <summary>
    /// Gets or sets event timestamp.
    /// </summary>
    public DateTime EventAt { get; set; }
}
