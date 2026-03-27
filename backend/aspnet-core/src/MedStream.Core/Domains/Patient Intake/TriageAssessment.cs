using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Stores triage output produced from intake answers.
/// </summary>
public class TriageAssessment : FullAuditedEntity<long>, IMustHaveTenant
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
    /// Gets or sets urgency level.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string UrgencyLevel { get; set; }

    /// <summary>
    /// Gets or sets priority score from 0 to 100.
    /// </summary>
    public decimal PriorityScore { get; set; }

    /// <summary>
    /// Gets or sets triage explanation text.
    /// </summary>
    [Required]
    [StringLength(2000)]
    public string Explanation { get; set; }

    /// <summary>
    /// Gets or sets serialized red flags.
    /// </summary>
    [StringLength(2000)]
    public string RedFlagsDetected { get; set; }

    /// <summary>
    /// Gets or sets whether queue position assignment is still pending.
    /// </summary>
    public bool PositionPending { get; set; }

    /// <summary>
    /// Gets or sets queue-facing status message.
    /// </summary>
    [Required]
    [StringLength(512)]
    public string QueueMessage { get; set; }

    /// <summary>
    /// Gets or sets queue status last updated timestamp.
    /// </summary>
    public DateTime LastQueueUpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets when triage was assessed.
    /// </summary>
    public DateTime AssessedAt { get; set; }
}
