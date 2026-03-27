using Abp.Dependency;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Executes JSON-defined clinical pathways.
/// </summary>
public class PathwayExecutionEngine : IPathwayExecutionEngine, ITransientDependency
{
    private readonly IPathwayDefinitionProvider _definitionProvider;
    private readonly IPathwayConditionEvaluator _conditionEvaluator;

    /// <summary>
    /// Initializes a new instance of the <see cref="PathwayExecutionEngine"/> class.
    /// </summary>
    public PathwayExecutionEngine(
        IPathwayDefinitionProvider definitionProvider,
        IPathwayConditionEvaluator conditionEvaluator)
    {
        _definitionProvider = definitionProvider;
        _conditionEvaluator = conditionEvaluator;
    }

    /// <inheritdoc />
    public PathwayExecutionResult Execute(PathwayExecutionRequest request)
    {
        var definition = _definitionProvider.GetById(request.PathwayId);
        var context = BuildContext(request.Answers, request.Observations);
        var result = new PathwayExecutionResult
        {
            PathwayId = definition.Id,
            Score = definition.Triage?.BaseScore ?? 0
        };

        result.NextQuestions = ResolveNextQuestions(definition, request, context);

        ApplyRuleSet(definition.GlobalChecks, context, result);
        ApplyFlowRules(definition.Flows, context, result);
        ApplyLinkRules(definition.Links, context, result);
        FinalizeTriageIndicators(definition, request.PrimarySymptoms, result);
        FilterVisibility(definition, request.Audience, result);

        return result;
    }

    private List<PathwayInputJson> ResolveNextQuestions(PathwayDefinitionJson definition, PathwayExecutionRequest request, IReadOnlyDictionary<string, object> context)
    {
        var stageInputs = definition.Inputs
            .Where(item => string.Equals(item.Stage, request.StageId, StringComparison.OrdinalIgnoreCase))
            .Where(item => string.Equals(item.EnteredBy, request.Audience, StringComparison.OrdinalIgnoreCase))
            .Where(item => item.When == null || _conditionEvaluator.Evaluate(item.When, context))
            .ToList();

        foreach (var question in stageInputs)
        {
            if (question.DisplayOrder.HasValue)
            {
                continue;
            }

            question.DisplayOrder = int.MaxValue;
        }

        var respiratoryPrimary = request.PrimarySymptoms.Any(item =>
            item.Contains("cough", StringComparison.OrdinalIgnoreCase) ||
            item.Contains("breathing", StringComparison.OrdinalIgnoreCase));
        if (respiratoryPrimary)
        {
            var breathingQuestion = stageInputs.FirstOrDefault(item => string.Equals(item.Id, "breathingDifficulty", StringComparison.OrdinalIgnoreCase));
            if (breathingQuestion != null)
            {
                breathingQuestion.DisplayOrder = 0;
            }
        }

        return stageInputs
            .OrderBy(item => item.DisplayOrder ?? int.MaxValue)
            .ThenBy(item => item.Id)
            .ToList();
    }

    private void ApplyRuleSet(IEnumerable<PathwayRuleJson> rules, IReadOnlyDictionary<string, object> context, PathwayExecutionResult result)
    {
        foreach (var rule in rules)
        {
            var triggered = _conditionEvaluator.Evaluate(rule.When, context);
            result.RuleTrace.Add(new PathwayRuleTraceItem
            {
                RuleId = rule.Id,
                Label = rule.Label,
                Triggered = triggered,
                EffectsSummary = string.Join(", ", rule.Effects.Select(item => item.Type))
            });

            if (!triggered)
            {
                continue;
            }

            ApplyEffects(rule.Effects, result);
        }
    }

    private void ApplyFlowRules(IEnumerable<PathwayFlowJson> flows, IReadOnlyDictionary<string, object> context, PathwayExecutionResult result)
    {
        foreach (var flow in flows)
        {
            var flowTriggered = _conditionEvaluator.Evaluate(flow.When, context);
            result.RuleTrace.Add(new PathwayRuleTraceItem
            {
                RuleId = flow.Id,
                Label = flow.Id,
                Triggered = flowTriggered,
                EffectsSummary = "flow"
            });

            if (!flowTriggered)
            {
                continue;
            }

            ApplyRuleSet(flow.Rules, context, result);
        }
    }

    private void ApplyLinkRules(IEnumerable<PathwayLinkJson> links, IReadOnlyDictionary<string, object> context, PathwayExecutionResult result)
    {
        foreach (var link in links)
        {
            var triggered = _conditionEvaluator.Evaluate(link.When, context);
            result.RuleTrace.Add(new PathwayRuleTraceItem
            {
                RuleId = link.Id,
                Label = link.Label,
                Triggered = triggered,
                EffectsSummary = "link"
            });

            if (!triggered)
            {
                continue;
            }

            result.TriggeredLinks.Add(new PathwayTriggeredLink
            {
                Id = link.Id,
                Label = link.Label,
                TargetPathwayId = link.TargetPathwayId,
                SourcePage = link.SourceReference?.Page
            });
        }
    }

    private static void ApplyEffects(IEnumerable<PathwayEffectJson> effects, PathwayExecutionResult result)
    {
        foreach (var effect in effects)
        {
            var effectType = effect.Type?.ToLowerInvariant();
            if (effectType == "score" && effect.Value.HasValue)
            {
                result.Score += effect.Value.Value;
                continue;
            }

            if (effectType == "red_flag" && !string.IsNullOrWhiteSpace(effect.RedFlag))
            {
                AddUnique(result.TriggeredRedFlags, effect.RedFlag);
                continue;
            }

            if (effectType == "flag" && !string.IsNullOrWhiteSpace(effect.Flag))
            {
                AddUnique(result.TriggeredRedFlags, effect.Flag);
                continue;
            }

            if (effectType == "outcome" && !string.IsNullOrWhiteSpace(effect.OutcomeId))
            {
                AddUnique(result.TriggeredOutcomeIds, effect.OutcomeId);
                continue;
            }

            if (effectType == "recommendation" && !string.IsNullOrWhiteSpace(effect.RecommendationId))
            {
                AddUnique(result.TriggeredRecommendationIds, effect.RecommendationId);
                continue;
            }

            if (effectType == "triage_indicator" &&
                !string.IsNullOrWhiteSpace(effect.Indicator) &&
                !string.IsNullOrWhiteSpace(effect.IndicatorValue))
            {
                result.TriageIndicators[effect.Indicator] = effect.IndicatorValue;
            }
        }
    }

    private static void FinalizeTriageIndicators(PathwayDefinitionJson definition, IReadOnlyCollection<string> primarySymptoms, PathwayExecutionResult result)
    {
        var urgentThreshold = definition.Triage?.UrgentThreshold ?? 75;
        var priorityThreshold = definition.Triage?.PriorityThreshold ?? 45;
        if (!result.TriageIndicators.ContainsKey("urgencyLevel"))
        {
            if (result.TriggeredRedFlags.Count > 0 || result.Score >= urgentThreshold)
            {
                result.TriageIndicators["urgencyLevel"] = "Urgent";
            }
            else if (result.Score >= priorityThreshold)
            {
                result.TriageIndicators["urgencyLevel"] = "Priority";
            }
            else
            {
                result.TriageIndicators["urgencyLevel"] = "Routine";
            }
        }

        var urgency = result.TriageIndicators["urgencyLevel"];
        if (string.Equals(urgency, "Urgent", StringComparison.OrdinalIgnoreCase))
        {
            result.Score = Math.Max(result.Score, urgentThreshold);
        }
        else if (string.Equals(urgency, "Priority", StringComparison.OrdinalIgnoreCase))
        {
            result.Score = Math.Max(result.Score, priorityThreshold);
        }

        result.TriageIndicators["priorityScore"] = result.Score.ToString(CultureInfo.InvariantCulture);
        var symptomText = primarySymptoms.Count > 0 ? string.Join(", ", primarySymptoms) : "reported symptoms";

        var explanation = urgency switch
        {
            "Urgent" => (definition.Triage?.UrgentExplanationTemplate ?? "Urgent triage because {redFlags} with {symptoms}.")
                .Replace("{redFlags}", result.TriggeredRedFlags.Count > 0 ? string.Join("; ", result.TriggeredRedFlags) : "critical indicators")
                .Replace("{symptoms}", symptomText),
            "Priority" => (definition.Triage?.PriorityExplanationTemplate ?? "Priority triage based on symptom severity profile for {symptoms}.")
                .Replace("{symptoms}", symptomText),
            _ => (definition.Triage?.RoutineExplanationTemplate ?? "Routine triage generated from {symptoms} with no immediate danger signs detected.")
                .Replace("{symptoms}", symptomText)
        };

        result.TriageIndicators["explanation"] = explanation;
    }

    private static void FilterVisibility(PathwayDefinitionJson definition, string audience, PathwayExecutionResult result)
    {
        var isPatient = string.Equals(audience, "patient", StringComparison.OrdinalIgnoreCase);
        if (!isPatient)
        {
            return;
        }

        if (!(definition.Visibility?.PatientCanSeeOutcomes ?? false))
        {
            result.TriggeredOutcomeIds.Clear();
        }

        if (definition.Visibility?.ClinicianOnlyRecommendations ?? true)
        {
            result.TriggeredRecommendationIds.Clear();
        }
    }

    private static Dictionary<string, object> BuildContext(IReadOnlyDictionary<string, object> answers, IReadOnlyDictionary<string, object> observations)
    {
        var context = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var pair in answers)
        {
            context[pair.Key] = pair.Value;
        }

        foreach (var pair in observations)
        {
            context[pair.Key] = pair.Value;
        }

        return context;
    }

    private static void AddUnique(ICollection<string> list, string value)
    {
        if (list.Contains(value, StringComparer.OrdinalIgnoreCase))
        {
            return;
        }

        list.Add(value);
    }
}
