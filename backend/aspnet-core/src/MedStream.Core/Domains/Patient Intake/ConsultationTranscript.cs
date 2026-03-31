using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Stores transcript material linked to the visit encounter note.
/// </summary>
public class ConsultationTranscript : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the owning encounter note id.
    /// </summary>
    public long EncounterNoteId { get; set; }

    /// <summary>
    /// Gets or sets clinician user id that captured or uploaded the source.
    /// </summary>
    public long CapturedByClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets transcript capture mode.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string InputMode { get; set; }

    /// <summary>
    /// Gets or sets the raw transcript content.
    /// </summary>
    [StringLength(32000)]
    public string RawTranscriptText { get; set; }

    /// <summary>
    /// Gets or sets translated transcript text when applicable.
    /// </summary>
    [StringLength(32000)]
    public string TranslatedTranscriptText { get; set; }

    /// <summary>
    /// Gets or sets detected language for the transcript.
    /// </summary>
    [StringLength(32)]
    public string LanguageDetected { get; set; }

    /// <summary>
    /// Gets or sets when the transcript was captured.
    /// </summary>
    public DateTime CapturedAt { get; set; }
}
