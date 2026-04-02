using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace MedStream.Consultation;

/// <summary>
/// Orchestrates consultation draft generation by combining OpenAI output with deterministic fallbacks.
/// </summary>
public partial class ConsultationDraftGenerator : IConsultationDraftGenerator
{
    private readonly IConfiguration _configuration;

    public ConsultationDraftGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<ConsultationDraftResult> GenerateSubjectiveDraftAsync(ConsultationDraftContext context)
    {
        var fallback = BuildFallbackSubjective(context);
        var aiResult = await TryGenerateJsonAsync(
            "Create a clinician-reviewable SOAP subjective draft. Merge intake handoff with transcript updates into one coherent clinical narrative. Rewrite the history in natural clinician-facing prose and do not simply append a literal transcript excerpt or a section called consultation updates. Preserve useful timing, symptom progression, associated symptoms, and relevant negatives when they are supported by the source material. Keep it readable and a bit more complete than a one-line summary. Use short paragraphs or bullet points only if that genuinely improves readability. Do not diagnose. Never echo raw field keys, booleans, machine labels, or verbatim quote fragments unless clinically necessary. Return JSON with keys source, summary, subjective.",
            new
            {
                context.PathwayName,
                context.ChiefComplaint,
                IntakeSubjective = CleanNarrative(context.IntakeSubjective),
                CurrentSubjective = CleanNarrative(context.CurrentSubjective),
                context.UrgencyLevel,
                context.TranscriptSegments
            });

        if (!aiResult.HasValue)
        {
            return fallback;
        }

        var content = aiResult.Value;
        return new ConsultationDraftResult
        {
            Source = ReadString(content, "source", "openai"),
            Summary = ReadString(content, "summary", fallback.Summary),
            Subjective = ReadString(content, "subjective", fallback.Subjective ?? string.Empty)
        };
    }

    public async Task<ConsultationDraftResult> GenerateAssessmentPlanDraftAsync(ConsultationDraftContext context)
    {
        var fallback = BuildFallbackAssessmentPlan(context);
        var aiResult = await TryGenerateJsonAsync(
            "Create a clinician-reviewable assessment and plan draft from the provided consultation context. The assessment must synthesize the clinically meaningful interpretation of the history, objective findings, and vitals; do not simply restate symptom labels or pathway names. Prefer the same level of usefulness as a careful clinician summary, using guarded language such as suggests, may reflect, concerning for, or needs evaluation when certainty is limited. The plan must be an actionable care plan for the current visit, not a generic workflow checklist, and should include focused reassessment, investigations or exam focus, monitoring, and immediate safety actions when supported by the available evidence. Ground the draft in the provided pathway and APC guidance when available, but do not let generic fallback pathway wording dominate the note. Use pathway-supported assessment hints and plan suggestions only when the current subjective, objective, transcript, or vitals support them. If evidence is limited, say so explicitly and avoid definitive diagnosis or treatment claims. Never echo raw form keys, booleans, or machine labels. Return JSON with keys source, summary, assessment, plan.",
            new
            {
                context.PathwayId,
                context.PathwayName,
                context.ChiefComplaint,
                CurrentSubjective = CleanNarrative(context.CurrentSubjective),
                CurrentObjective = CleanNarrative(context.CurrentObjective),
                context.UrgencyLevel,
                context.TriageExplanation,
                context.LatestVitalsSummary,
                ObjectiveFocusHints = context.ObjectiveFocusHints,
                PathwayAssessmentHints = context.PathwayAssessmentHints,
                PathwayPlanHints = context.PathwayPlanHints,
                ApcReferenceLinks = context.ApcReferenceLinks,
                context.TranscriptSegments
            });

        if (!aiResult.HasValue)
        {
            return fallback;
        }

        var content = aiResult.Value;
        return new ConsultationDraftResult
        {
            Source = ReadString(content, "source", "openai"),
            Summary = ReadString(content, "summary", fallback.Summary),
            Assessment = ReadString(content, "assessment", fallback.Assessment ?? string.Empty),
            Plan = ReadString(content, "plan", fallback.Plan ?? string.Empty)
        };
    }
}
