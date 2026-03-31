#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MedStream.Consultation;

/// <summary>
/// Generates clinician-reviewable SOAP draft suggestions from intake, transcript, and note context.
/// </summary>
public interface IConsultationDraftGenerator
{
    Task<ConsultationDraftResult> GenerateSubjectiveDraftAsync(ConsultationDraftContext context);

    Task<ConsultationDraftResult> GenerateAssessmentPlanDraftAsync(ConsultationDraftContext context);
}

public class ConsultationDraftContext
{
    public string ChiefComplaint { get; set; } = string.Empty;

    public string IntakeSubjective { get; set; } = string.Empty;

    public string CurrentSubjective { get; set; } = string.Empty;

    public string CurrentObjective { get; set; } = string.Empty;

    public string CurrentAssessment { get; set; } = string.Empty;

    public string CurrentPlan { get; set; } = string.Empty;

    public string UrgencyLevel { get; set; } = string.Empty;

    public string LatestVitalsSummary { get; set; } = string.Empty;

    public IReadOnlyList<string> TranscriptSegments { get; set; } = new List<string>();
}

public class ConsultationDraftResult
{
    public string Source { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string? Subjective { get; set; }

    public string? Assessment { get; set; }

    public string? Plan { get; set; }
}
