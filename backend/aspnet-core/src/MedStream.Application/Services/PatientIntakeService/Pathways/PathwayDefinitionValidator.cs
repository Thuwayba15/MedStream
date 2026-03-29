using Abp.Dependency;
using Abp.UI;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Validates pathway JSON definition integrity.
/// </summary>
public class PathwayDefinitionValidator : ITransientDependency
{
    /// <summary>
    /// Validates a pathway definition and throws on invalid state.
    /// </summary>
    public void Validate(PathwayDefinitionJson definition)
    {
        if (definition == null)
        {
            throw new UserFriendlyException("Pathway definition is missing.");
        }

        if (string.IsNullOrWhiteSpace(definition.Id))
        {
            throw new UserFriendlyException("Pathway definition id is required.");
        }

        if (definition.Entry?.IsEntryPathway == true &&
            !string.Equals(definition.Id, MedStream.PatientIntake.PatientIntakeConstants.GeneralFallbackPathwayKey, System.StringComparison.OrdinalIgnoreCase))
        {
            var hasClassificationSignals =
                (definition.Entry.ComplaintKeywords?.Count ?? 0) > 0 ||
                (definition.Entry.Synonyms?.Count ?? 0) > 0 ||
                (definition.Entry.CommonPhrases?.Count ?? 0) > 0;

            if (!hasClassificationSignals)
            {
                throw new UserFriendlyException($"Entry pathway '{definition.Id}' must define complaintKeywords, synonyms, or commonPhrases.");
            }
        }

        var duplicateInputIds = definition.Inputs
            .GroupBy(item => item.Id)
            .Where(group => !string.IsNullOrWhiteSpace(group.Key) && group.Count() > 1)
            .Select(group => group.Key)
            .ToList();
        if (duplicateInputIds.Count > 0)
        {
            throw new UserFriendlyException($"Duplicate input ids detected in pathway '{definition.Id}': {string.Join(", ", duplicateInputIds)}");
        }

        var knownOutcomeIds = new HashSet<string>(definition.Outcomes.Select(item => item.Id));
        var knownRecommendationIds = new HashSet<string>(definition.Recommendations.Select(item => item.Id));
        var unknownOutcomeReferences = new List<string>();
        var unknownRecommendationReferences = new List<string>();

        foreach (var rule in definition.GlobalChecks)
        {
            ValidateRuleEffects(definition.Id, rule, knownOutcomeIds, knownRecommendationIds, unknownOutcomeReferences, unknownRecommendationReferences);
        }

        foreach (var flow in definition.Flows)
        {
            foreach (var rule in flow.Rules)
            {
                ValidateRuleEffects(definition.Id, rule, knownOutcomeIds, knownRecommendationIds, unknownOutcomeReferences, unknownRecommendationReferences);
            }
        }

        if (unknownOutcomeReferences.Count > 0)
        {
            throw new UserFriendlyException($"Unknown outcome references in pathway '{definition.Id}': {string.Join(", ", unknownOutcomeReferences.Distinct())}");
        }

        if (unknownRecommendationReferences.Count > 0)
        {
            throw new UserFriendlyException($"Unknown recommendation references in pathway '{definition.Id}': {string.Join(", ", unknownRecommendationReferences.Distinct())}");
        }
    }

    private static void ValidateRuleEffects(
        string pathwayId,
        PathwayRuleJson rule,
        ISet<string> knownOutcomeIds,
        ISet<string> knownRecommendationIds,
        ICollection<string> unknownOutcomeReferences,
        ICollection<string> unknownRecommendationReferences)
    {
        foreach (var effect in rule.Effects)
        {
            if (string.Equals(effect.Type, "outcome", System.StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(effect.OutcomeId) &&
                !knownOutcomeIds.Contains(effect.OutcomeId))
            {
                unknownOutcomeReferences.Add($"{pathwayId}:{rule.Id}:{effect.OutcomeId}");
            }

            if (string.Equals(effect.Type, "recommendation", System.StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(effect.RecommendationId) &&
                !knownRecommendationIds.Contains(effect.RecommendationId))
            {
                unknownRecommendationReferences.Add($"{pathwayId}:{rule.Id}:{effect.RecommendationId}");
            }
        }
    }
}
