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
}
