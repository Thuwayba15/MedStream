using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.Consultation;

public partial class ConsultationDraftGenerator
{
    private static ConsultationDraftResult BuildFallbackAssessmentPlan(ConsultationDraftContext context)
    {
        var cleanedSubjective = CleanNarrative(context.CurrentSubjective);
        var cleanedObjective = CleanNarrative(context.CurrentObjective);
        var vitalsSummary = TrimEnding(context.LatestVitalsSummary ?? string.Empty);
        var assessmentParts = new List<string>();
        var planParts = new List<string>();
        var isGenericFallbackPathway = string.Equals(context.PathwayId, "general_unspecified_complaint", StringComparison.OrdinalIgnoreCase);
        var conciseSubjective = BuildConciseSubjectiveSummary(cleanedSubjective);
        var objectiveHighlights = ExtractNarrativeHighlights(cleanedObjective);
        var subjectiveHighlights = ExtractNarrativeHighlights(conciseSubjective);
        var triageNote = CleanNarrative(context.TriageExplanation);
        var physiologicInterpretation = BuildPhysiologicInterpretation(context.LatestVitalsSummary);
        var actionPlanHints = BuildActionPlanHints(context.LatestVitalsSummary, cleanedSubjective, cleanedObjective, context.ObjectiveFocusHints);

        assessmentParts.Add("1. Clinical impression");
        if (objectiveHighlights.Count > 0)
        {
            assessmentParts.Add($"- Documented objective findings include {JoinWithAnd(objectiveHighlights)}.");
        }

        if (subjectiveHighlights.Count > 0)
        {
            assessmentParts.Add($"- Current presentation is characterized by {JoinWithAnd(subjectiveHighlights)}.");
        }

        if (string.IsNullOrWhiteSpace(physiologicInterpretation) && objectiveHighlights.Count == 0 && subjectiveHighlights.Count == 0)
        {
            assessmentParts.Add("- Limited clinician-entered evidence is available, so the assessment remains provisional.");
        }

        if (!string.IsNullOrWhiteSpace(vitalsSummary))
        {
            assessmentParts.Add("2. Vitals and physiological context");
            assessmentParts.Add($"- Latest vitals recorded: {vitalsSummary}.");
            if (!string.IsNullOrWhiteSpace(physiologicInterpretation))
            {
                assessmentParts.Add($"- These findings {physiologicInterpretation}.");
            }
        }

        var assessmentHints = context.PathwayAssessmentHints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Where(item => !isGenericFallbackPathway || !item.Contains("general review", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (assessmentHints.Count > 0)
        {
            assessmentParts.Add("3. Supported considerations");
            assessmentParts.Add($"- Based on the documented findings, consider {JoinWithAnd(assessmentHints.Take(3))}, pending clinician confirmation.");
        }
        else if (!string.IsNullOrWhiteSpace(context.PathwayName) && !isGenericFallbackPathway)
        {
            assessmentParts.Add("3. Pathway context");
            assessmentParts.Add($"- The presentation aligns most closely with the {context.PathwayName} pathway, subject to clinician review.");
        }

        if (!string.IsNullOrWhiteSpace(triageNote) &&
            !isGenericFallbackPathway &&
            !triageNote.Contains("General intake captured", StringComparison.OrdinalIgnoreCase))
        {
            assessmentParts.Add("4. Triage note");
            assessmentParts.Add($"- {TrimEnding(triageNote)}.");
        }

        planParts.Add(actionPlanHints.Count > 0 ? "1. Immediate safety and reassessment" : "1. Immediate next steps");
        var planHints = context.PathwayPlanHints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => TrimEnding(item.Trim()))
            .Where(item => !isGenericFallbackPathway || !item.Contains("route to specific pathway", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (actionPlanHints.Count > 0)
        {
            planParts.Add($"   {JoinWithAnd(actionPlanHints.Take(3))}.");
        }
        else if (planHints.Count > 0)
        {
            planParts.Add($"   Follow pathway-supported next steps such as {JoinWithAnd(planHints.Take(2))}.");
        }
        else if (objectiveHighlights.Count > 0)
        {
            planParts.Add($"   Continue management based on the recorded findings, including {JoinWithAnd(objectiveHighlights.Take(3))}, and the patient's current clinical stability.");
        }
        else
        {
            planParts.Add("   Continue clinician-directed evaluation and management based on the available findings.");
        }

        planParts.Add("2. Focused clinical review");
        if (context.ObjectiveFocusHints.Count > 0)
        {
            planParts.Add($"   Complete clinician assessment with focus on {JoinWithAnd(context.ObjectiveFocusHints.Take(3))}.");
        }
        else if (subjectiveHighlights.Count > 0)
        {
            planParts.Add($"   Perform focused review and examination for {JoinWithAnd(subjectiveHighlights.Take(3))}.");
        }
        else if (!string.IsNullOrWhiteSpace(cleanedObjective))
        {
            planParts.Add("   Reassess the documented objective findings and update the note if the examination changes.");
        }
        else
        {
            planParts.Add("   Confirm the key objective findings that will support the final assessment.");
        }

        planParts.Add("3. Monitoring and reassessment");
        if (!string.IsNullOrWhiteSpace(vitalsSummary))
        {
            planParts.Add($"   Repeat and document vitals as clinically indicated ({vitalsSummary}).");
        }
        else
        {
            planParts.Add("   Record or repeat vital signs if they are needed to complete the visit assessment.");
        }

        planParts.Add("4. Treatment and disposition planning");
        if (planHints.Count > 0)
        {
            planParts.Add($"   Use the pathway-supported plan as clinically appropriate, including {JoinWithAnd(planHints.Take(3))}, and adjust based on examination findings.");
        }
        else if (actionPlanHints.Count > 0)
        {
            planParts.Add("   Escalate treatment, investigations, and disposition decisions according to the confirmed bedside findings and overall clinical stability.");
        }
        else
        {
            planParts.Add("   Confirm the final diagnosis, management steps, and disposition clinically before completing the visit.");
        }

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = BuildGroundingSummary(context),
            Assessment = string.Join("\n", assessmentParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim(),
            Plan = string.Join("\n", planParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim()
        };
    }
}
