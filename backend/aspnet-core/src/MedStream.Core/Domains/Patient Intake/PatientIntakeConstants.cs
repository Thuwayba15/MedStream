namespace MedStream.PatientIntake;

/// <summary>
/// Defines constants and controlled values used by the patient intake workflow.
/// </summary>
public static class PatientIntakeConstants
{
    /// <summary>
    /// Placeholder pathway key used before symptoms are classified.
    /// </summary>
    public const string UnassignedPathwayKey = "unassigned";

    /// <summary>
    /// General fallback pathway key used for low-confidence or nonsensical intake complaints.
    /// </summary>
    public const string GeneralFallbackPathwayKey = "general_unspecified_complaint";

    /// <summary>
    /// Default pathway key when no stronger selection is available.
    /// </summary>
    public const string DefaultPathwayKey = GeneralFallbackPathwayKey;

    /// <summary>
    /// Visit status used while intake is still in progress.
    /// </summary>
    public const string VisitStatusIntakeInProgress = "IntakeInProgress";

    /// <summary>
    /// Visit status used once triage has been completed.
    /// </summary>
    public const string VisitStatusTriageCompleted = "TriageCompleted";

    /// <summary>
    /// Visit status used once a queue ticket has been created.
    /// </summary>
    public const string VisitStatusQueued = "Queued";

    /// <summary>
    /// Visit status used once a clinician has opened the consultation workspace.
    /// </summary>
    public const string VisitStatusInConsultation = "InConsultation";

    /// <summary>
    /// Visit status used once consultation work has been completed.
    /// </summary>
    public const string VisitStatusCompleted = "Completed";

    /// <summary>
    /// Extraction source label for real OpenAI extraction.
    /// </summary>
    public const string ExtractionSourceAi = "ai";

    /// <summary>
    /// Extraction source label for deterministic fallback extraction.
    /// </summary>
    public const string ExtractionSourceDeterministicFallback = "deterministic_fallback";

    /// <summary>
    /// Intake mode using approved JSON pathway definition directly.
    /// </summary>
    public const string IntakeModeApprovedJson = "approved_json";

    /// <summary>
    /// Intake mode using APC summary-backed AI fallback questions.
    /// </summary>
    public const string IntakeModeApcFallback = "apc_fallback";

    /// <summary>
    /// Queue status for patients waiting to be called.
    /// </summary>
    public const string QueueStatusWaiting = "waiting";

    /// <summary>
    /// Queue status for patients called by a clinician.
    /// </summary>
    public const string QueueStatusCalled = "called";

    /// <summary>
    /// Queue status for patients currently in consultation.
    /// </summary>
    public const string QueueStatusInConsultation = "in_consultation";

    /// <summary>
    /// Queue status for completed consultations.
    /// </summary>
    public const string QueueStatusCompleted = "completed";

    /// <summary>
    /// Queue status for cancelled queue tickets.
    /// </summary>
    public const string QueueStatusCancelled = "cancelled";

    /// <summary>
    /// Queue event type recorded when a visit enters queue.
    /// </summary>
    public const string QueueEventEntered = "entered_queue";

    /// <summary>
    /// Queue event type recorded when queue status changes.
    /// </summary>
    public const string QueueEventStatusChanged = "status_changed";

    /// <summary>
    /// Queue event type recorded when consultation starts from queue.
    /// </summary>
    public const string QueueEventConsultationStarted = "consultation_started";

    /// <summary>
    /// Encounter note status while it is still editable.
    /// </summary>
    public const string EncounterNoteStatusDraft = "draft";

    /// <summary>
    /// Encounter note status once the clinician finalizes the note.
    /// </summary>
    public const string EncounterNoteStatusFinalized = "finalized";

    /// <summary>
    /// Transcript input mode for typed notes.
    /// </summary>
    public const string TranscriptInputModeTyped = "typed";

    /// <summary>
    /// Transcript input mode for uploaded audio.
    /// </summary>
    public const string TranscriptInputModeAudioUpload = "audio_upload";

    /// <summary>
    /// Vital signs captured during triage.
    /// </summary>
    public const string VitalSignsPhaseTriage = "triage";

    /// <summary>
    /// Vital signs captured during consultation.
    /// </summary>
    public const string VitalSignsPhaseConsultation = "consultation";
}
