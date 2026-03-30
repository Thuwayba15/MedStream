using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Live queue ticket representing a visit in the facility workflow.
/// </summary>
public class QueueTicket : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the facility id for queue operations.
    /// </summary>
    public int FacilityId { get; set; }

    /// <summary>
    /// Gets or sets the related visit id.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets the triage assessment linked to this ticket.
    /// </summary>
    public long TriageAssessmentId { get; set; }

    /// <summary>
    /// Gets or sets queue date (UTC date boundary) used for daily numbering.
    /// </summary>
    public DateTime QueueDate { get; set; }

    /// <summary>
    /// Gets or sets sequential queue number within facility and queue date.
    /// </summary>
    public int QueueNumber { get; set; }

    /// <summary>
    /// Gets or sets current queue status.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string QueueStatus { get; set; }

    /// <summary>
    /// Gets or sets current stage label shown to clinician workflows.
    /// </summary>
    [Required]
    [StringLength(64)]
    public string CurrentStage { get; set; }

    /// <summary>
    /// Gets or sets whether ticket is currently active in queue.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Gets or sets when patient entered queue.
    /// </summary>
    public DateTime EnteredQueueAt { get; set; }

    /// <summary>
    /// Gets or sets when ticket was called.
    /// </summary>
    public DateTime? CalledAt { get; set; }

    /// <summary>
    /// Gets or sets when consultation started.
    /// </summary>
    public DateTime? ConsultationStartedAt { get; set; }

    /// <summary>
    /// Gets or sets clinician user id that started consultation.
    /// </summary>
    public long? ConsultationStartedByClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets when queue ticket completed.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Gets or sets when queue ticket was cancelled.
    /// </summary>
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Gets or sets optional room assignment.
    /// </summary>
    [StringLength(64)]
    public string AssignedRoom { get; set; }

    /// <summary>
    /// Gets or sets currently assigned clinician user id.
    /// </summary>
    public long? CurrentClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets queue status last-updated timestamp.
    /// </summary>
    public DateTime LastStatusChangedAt { get; set; }
}
