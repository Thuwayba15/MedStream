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
    /// Default pathway key for the MVP intake workflow.
    /// </summary>
    public const string DefaultPathwayKey = "general_adult_fever_cough";

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
}
