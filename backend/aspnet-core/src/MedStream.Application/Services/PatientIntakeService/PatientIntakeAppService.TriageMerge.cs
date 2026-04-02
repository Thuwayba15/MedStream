#nullable enable
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.PatientIntake;

public partial class PatientIntakeAppService
{
    private sealed class MergedTriageAssessment
    {
        public string UrgencyLevel { get; set; } = "Routine";

        public string Explanation { get; set; } = "Triage assessment completed.";

        public decimal PriorityScore { get; set; }

        public PathwayExecutionResult Execution { get; set; } = new();
    }

    private sealed class ApcFallbackTriageContribution
    {
        public string? UrgencyFloor { get; set; }

        public decimal ScoreFloor { get; set; }

        public List<string> RedFlags { get; } = new();

        public List<string> ExplanationParts { get; } = new();
    }

    private MergedTriageAssessment ResolveMergedTriageAssessment(
        AssessTriageInput input,
        string safePathwayKey,
        IReadOnlyDictionary<string, object> answers,
        IReadOnlyDictionary<string, object> observations)
    {
        var approvedExecutions = BuildApprovedPathwayExecutions(input, safePathwayKey, answers, observations);
        var leadingExecution = approvedExecutions
            .OrderByDescending(GetUrgencyRank)
            .ThenByDescending(item => item.Score)
            .First();
        var apcContribution = EvaluateApcFallbackContribution(input, answers);
        var mergedExecution = MergeExecutions(approvedExecutions, apcContribution);

        var resolvedUrgency = ResolveMergedUrgency(leadingExecution, apcContribution);
        var resolvedScore = Math.Max(
            approvedExecutions.Max(item => item.Score),
            apcContribution.ScoreFloor);

        var resolvedExplanation = BuildMergedExplanation(approvedExecutions, leadingExecution, resolvedUrgency, apcContribution);
        mergedExecution.Score = resolvedScore;
        mergedExecution.TriageIndicators["urgencyLevel"] = resolvedUrgency;
        mergedExecution.TriageIndicators["priorityScore"] = resolvedScore.ToString(System.Globalization.CultureInfo.InvariantCulture);
        mergedExecution.TriageIndicators["explanation"] = resolvedExplanation;

        return new MergedTriageAssessment
        {
            UrgencyLevel = resolvedUrgency,
            Explanation = resolvedExplanation,
            PriorityScore = resolvedScore,
            Execution = mergedExecution
        };
    }

    private List<PathwayExecutionResult> BuildApprovedPathwayExecutions(
        AssessTriageInput input,
        string safePathwayKey,
        IReadOnlyDictionary<string, object> answers,
        IReadOnlyDictionary<string, object> observations)
    {
        var executions = new List<PathwayExecutionResult>
        {
            ExecuteApprovedPathway(safePathwayKey, input.ExtractedPrimarySymptoms ?? new List<string>(), answers, observations)
        };

        foreach (var plan in input.FollowUpPlans
                     .Where(item => string.Equals(item.IntakeMode, PatientIntakeConstants.IntakeModeApprovedJson, StringComparison.OrdinalIgnoreCase))
                     .Where(item => !string.IsNullOrWhiteSpace(item.PathwayKey))
                     .GroupBy(item => $"{item.PathwayKey}|{item.PrimarySymptom}", StringComparer.OrdinalIgnoreCase)
                     .Select(group => group.First()))
        {
            if (string.Equals(plan.PathwayKey, safePathwayKey, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            IReadOnlyCollection<string> primarySymptoms = string.IsNullOrWhiteSpace(plan.PrimarySymptom)
                ? input.ExtractedPrimarySymptoms ?? new List<string>()
                : new List<string> { plan.PrimarySymptom.Trim() };
            executions.Add(ExecuteApprovedPathway(plan.PathwayKey, primarySymptoms, answers, observations));
        }

        return executions;
    }

    private PathwayExecutionResult ExecuteApprovedPathway(
        string pathwayKey,
        IReadOnlyCollection<string> primarySymptoms,
        IReadOnlyDictionary<string, object> answers,
        IReadOnlyDictionary<string, object> observations)
    {
        return _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = pathwayKey,
            StageId = "patient_intake",
            Audience = "patient",
            PrimarySymptoms = primarySymptoms,
            Answers = answers,
            Observations = observations
        });
    }

    private static PathwayExecutionResult MergeExecutions(
        IReadOnlyCollection<PathwayExecutionResult> approvedExecutions,
        ApcFallbackTriageContribution apcContribution)
    {
        var merged = new PathwayExecutionResult
        {
            PathwayId = string.Join("+", approvedExecutions.Select(item => item.PathwayId).Distinct(StringComparer.OrdinalIgnoreCase))
        };

        foreach (var execution in approvedExecutions)
        {
            foreach (var redFlag in execution.TriggeredRedFlags)
            {
                AddUnique(merged.TriggeredRedFlags, redFlag);
            }

            foreach (var outcomeId in execution.TriggeredOutcomeIds)
            {
                AddUnique(merged.TriggeredOutcomeIds, outcomeId);
            }

            foreach (var recommendationId in execution.TriggeredRecommendationIds)
            {
                AddUnique(merged.TriggeredRecommendationIds, recommendationId);
            }

            foreach (var link in execution.TriggeredLinks)
            {
                if (merged.TriggeredLinks.Any(item => string.Equals(item.Id, link.Id, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                merged.TriggeredLinks.Add(link);
            }

            merged.RuleTrace.AddRange(execution.RuleTrace);
        }

        foreach (var redFlag in apcContribution.RedFlags)
        {
            AddUnique(merged.TriggeredRedFlags, redFlag);
        }

        return merged;
    }

    private static string ResolveMergedUrgency(PathwayExecutionResult leadingExecution, ApcFallbackTriageContribution apcContribution)
    {
        var approvedUrgency = leadingExecution.TriageIndicators.TryGetValue("urgencyLevel", out var urgency)
            ? urgency
            : "Routine";

        if (string.IsNullOrWhiteSpace(apcContribution.UrgencyFloor))
        {
            return approvedUrgency;
        }

        return GetUrgencyRank(apcContribution.UrgencyFloor) > GetUrgencyRank(approvedUrgency)
            ? apcContribution.UrgencyFloor
            : approvedUrgency;
    }

    private static string BuildMergedExplanation(
        IReadOnlyCollection<PathwayExecutionResult> approvedExecutions,
        PathwayExecutionResult leadingExecution,
        string resolvedUrgency,
        ApcFallbackTriageContribution apcContribution)
    {
        var explanation = leadingExecution.TriageIndicators.TryGetValue("explanation", out var leadingExplanation)
            ? leadingExplanation
            : "Triage assessment completed.";

        if (approvedExecutions.Count > 1)
        {
            explanation = $"{explanation} Highest-risk follow-up pathway determines final triage.";
        }

        if (apcContribution.ExplanationParts.Count > 0)
        {
            explanation = $"{explanation} Additional fallback concerns: {string.Join("; ", apcContribution.ExplanationParts.Distinct(StringComparer.OrdinalIgnoreCase))}.";
        }

        if (!string.Equals(resolvedUrgency, "Routine", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(explanation, "Triage assessment completed.", StringComparison.OrdinalIgnoreCase))
        {
            return $"{resolvedUrgency} triage generated from combined follow-up assessment.";
        }

        return explanation;
    }

    private static ApcFallbackTriageContribution EvaluateApcFallbackContribution(
        AssessTriageInput input,
        IReadOnlyDictionary<string, object> answers)
    {
        var contribution = new ApcFallbackTriageContribution();
        foreach (var question in input.FollowUpQuestions.Where(item => string.Equals(item.IntakeMode, PatientIntakeConstants.IntakeModeApcFallback, StringComparison.OrdinalIgnoreCase)))
        {
            if (!answers.TryGetValue(question.QuestionKey, out var answerValue))
            {
                continue;
            }

            ApplyApcRiskHeuristic(question, answerValue, contribution);
        }

        return contribution;
    }

    private static void ApplyApcRiskHeuristic(
        AssessTriageFollowUpQuestionInput question,
        object answerValue,
        ApcFallbackTriageContribution contribution)
    {
        var normalizedQuestion = NormalizeQuestionText(question.QuestionText);
        if (string.IsNullOrWhiteSpace(normalizedQuestion))
        {
            return;
        }

        if (MatchesUrgentApcQuestion(normalizedQuestion) && IsAffirmativeRiskAnswer(normalizedQuestion, answerValue))
        {
            contribution.UrgencyFloor = "Urgent";
            contribution.ScoreFloor = Math.Max(contribution.ScoreFloor, 95m);
            AddUnique(contribution.RedFlags, $"apc_{SlugifyRedFlag(normalizedQuestion)}");
            contribution.ExplanationParts.Add(question.QuestionText.Trim());
            return;
        }

        if (MatchesPriorityApcQuestion(normalizedQuestion) && IsAffirmativeRiskAnswer(normalizedQuestion, answerValue))
        {
            if (GetUrgencyRank(contribution.UrgencyFloor) < GetUrgencyRank("Priority"))
            {
                contribution.UrgencyFloor = "Priority";
            }

            contribution.ScoreFloor = Math.Max(contribution.ScoreFloor, 55m);
            AddUnique(contribution.RedFlags, $"apc_{SlugifyRedFlag(normalizedQuestion)}");
            contribution.ExplanationParts.Add(question.QuestionText.Trim());
        }
    }

    private static bool MatchesUrgentApcQuestion(string normalizedQuestion)
    {
        return normalizedQuestion.Contains("struggling to breathe", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("shortness of breath", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("severe chest pain", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("heavy bleeding", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("bleeding that is not stopping", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("faint", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("collapse", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("lose consciousness", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("difficult to wake", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("confused", StringComparison.OrdinalIgnoreCase);
    }

    private static bool MatchesPriorityApcQuestion(string normalizedQuestion)
    {
        return normalizedQuestion.Contains("severe pain", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("unable to move", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("cannot move", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("hearing loss", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("vision loss", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("numb", StringComparison.OrdinalIgnoreCase) ||
               normalizedQuestion.Contains("weakness", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAffirmativeRiskAnswer(string normalizedQuestion, object answerValue)
    {
        if (answerValue is bool boolValue)
        {
            return boolValue;
        }

        if (answerValue is string stringValue)
        {
            var normalizedAnswer = stringValue.Trim().ToLowerInvariant();
            if (normalizedAnswer is "true" or "yes" or "limited" or "unable" or "severe")
            {
                return true;
            }

            if (normalizedAnswer is "no" or "false")
            {
                return normalizedQuestion.StartsWith("can you ", StringComparison.OrdinalIgnoreCase) ||
                       normalizedQuestion.StartsWith("are you able to ", StringComparison.OrdinalIgnoreCase);
            }

            return false;
        }

        if (answerValue is IEnumerable<object> objectValues)
        {
            return objectValues.Select(item => item?.ToString()?.Trim().ToLowerInvariant())
                .Any(item => !string.IsNullOrWhiteSpace(item) && item != "none");
        }

        if (answerValue is IEnumerable<string> stringValues)
        {
            return stringValues.Any(item => !string.IsNullOrWhiteSpace(item) && !string.Equals(item, "none", StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    private static int GetUrgencyRank(PathwayExecutionResult execution)
    {
        return execution.TriageIndicators.TryGetValue("urgencyLevel", out var urgency)
            ? GetUrgencyRank(urgency)
            : 0;
    }

    private static int GetUrgencyRank(string? urgency)
    {
        return urgency?.Trim().ToLowerInvariant() switch
        {
            "urgent" => 3,
            "priority" => 2,
            _ => 1
        };
    }

    private static string NormalizeQuestionText(string questionText)
    {
        return (questionText ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string SlugifyRedFlag(string normalizedQuestion)
    {
        var compact = new string(normalizedQuestion
            .Select(character => char.IsLetterOrDigit(character) ? character : '_')
            .ToArray());
        while (compact.Contains("__", StringComparison.Ordinal))
        {
            compact = compact.Replace("__", "_", StringComparison.Ordinal);
        }

        return compact.Trim('_');
    }

    private static void AddUnique(ICollection<string> values, string value)
    {
        if (values.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        values.Add(value);
    }
}
