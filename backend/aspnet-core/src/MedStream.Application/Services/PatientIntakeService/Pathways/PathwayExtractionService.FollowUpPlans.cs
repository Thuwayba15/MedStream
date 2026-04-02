using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.PatientIntake.Pathways;

public partial class PathwayExtractionService
{
    private static readonly IReadOnlyDictionary<string, string[]> PathwayCoveredSymptoms = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        { "cough_or_difficulty_breathing", new[] { "Cough", "Difficulty Breathing" } },
        { "hand_or_upper_limb_injury", new[] { "Injury", "Swelling", "Pain" } },
        { PatientIntakeConstants.GeneralFallbackPathwayKey, Array.Empty<string>() }
    };

    private static readonly IReadOnlyDictionary<string, string> SymptomToFallbackSummaryId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { "Headache", "headache" },
        { "Dizziness", "dizziness" },
        { "Nausea", "nausea_vomiting" },
        { "Chest Pain", "chest_pain" },
        { "Fever", "fever" }
    };

    private List<FollowUpPlan> BuildFollowUpPlans(
        string selectedPathwayId,
        string intakeMode,
        IReadOnlyCollection<string> extractedSymptoms,
        IReadOnlyCollection<string> fallbackSummaryIds)
    {
        var plans = new List<FollowUpPlan>();

        if (string.Equals(intakeMode, PatientIntakeConstants.IntakeModeApcFallback, StringComparison.OrdinalIgnoreCase))
        {
            plans.Add(new FollowUpPlan
            {
                PlanKey = "apc_fallback_primary",
                Title = "Tell us more about your symptoms",
                PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey,
                PrimarySymptom = extractedSymptoms.FirstOrDefault() ?? "General Illness",
                IntakeMode = PatientIntakeConstants.IntakeModeApcFallback,
                FallbackSummaryIds = fallbackSummaryIds?.ToList() ?? new List<string>()
            });
            return plans;
        }

        var primaryDefinition = _definitionProvider.GetById(selectedPathwayId);
        plans.Add(new FollowUpPlan
        {
            PlanKey = selectedPathwayId,
            Title = primaryDefinition.Name,
            PathwayKey = selectedPathwayId,
            PrimarySymptom = extractedSymptoms.FirstOrDefault() ?? selectedPathwayId,
            IntakeMode = PatientIntakeConstants.IntakeModeApprovedJson
        });

        var coveredSymptoms = PathwayCoveredSymptoms.TryGetValue(selectedPathwayId, out var mappedCoveredSymptoms)
            ? mappedCoveredSymptoms
            : Array.Empty<string>();

        foreach (var symptom in extractedSymptoms
                     .Where(item => !string.IsNullOrWhiteSpace(item))
                     .Where(item => !coveredSymptoms.Contains(item, StringComparer.OrdinalIgnoreCase))
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!SymptomToFallbackSummaryId.TryGetValue(symptom, out var summaryId))
            {
                continue;
            }

            if (_apcSummaryProvider.GetByIds(new[] { summaryId }).Count == 0)
            {
                continue;
            }

            plans.Add(new FollowUpPlan
            {
                PlanKey = $"apc_{summaryId}",
                Title = $"{symptom} details",
                PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey,
                PrimarySymptom = symptom,
                IntakeMode = PatientIntakeConstants.IntakeModeApcFallback,
                FallbackSummaryIds = new List<string> { summaryId }
            });
        }

        return plans
            .GroupBy(item => item.PlanKey, StringComparer.OrdinalIgnoreCase)
            .Select(item => item.First())
            .ToList();
    }
}
