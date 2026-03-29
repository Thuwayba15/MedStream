using Abp.Dependency;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Deterministic intake classifier that ranks entry pathways using normalized complaint signals.
/// </summary>
public class PathwayClassifier : IPathwayClassifier, ITransientDependency
{
    private readonly IPathwayDefinitionProvider _definitionProvider;
    private readonly IComplaintTextNormalizer _complaintTextNormalizer;
    private readonly IPathwayClassificationScorer _classificationScorer;

    /// <summary>
    /// Initializes a new instance of the <see cref="PathwayClassifier"/> class.
    /// </summary>
    public PathwayClassifier(
        IPathwayDefinitionProvider definitionProvider,
        IComplaintTextNormalizer complaintTextNormalizer,
        IPathwayClassificationScorer classificationScorer)
    {
        _definitionProvider = definitionProvider;
        _complaintTextNormalizer = complaintTextNormalizer;
        _classificationScorer = classificationScorer;
    }

    /// <inheritdoc />
    public PathwayClassificationResult ClassifyLikelyPathways(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        var normalizedComplaint = _complaintTextNormalizer.Normalize(freeText, selectedSymptoms, extractedPrimarySymptoms);
        var candidates = _definitionProvider.GetAllActive()
            .Where(item => item.Entry?.IsEntryPathway ?? false)
            .Select(item => _classificationScorer.Score(item, normalizedComplaint))
            .Where(item => item.TotalScore > 0)
            .OrderByDescending(item => item.TotalScore)
            .ThenBy(item => item.PathwayId, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
        candidates = candidates
            .Where(item => item.MatchedSignals.Any(signal => signal.Weight > 0m && !string.Equals(signal.SignalType, "entry_priority", StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (candidates.Count == 0)
        {
            return BuildNoMatchFallback(normalizedComplaint);
        }

        ApplyConfidence(candidates);
        var topCandidate = candidates[0];
        var secondCandidate = candidates.Count > 1 ? candidates[1] : null;
        var margin = secondCandidate == null ? topCandidate.TotalScore : topCandidate.TotalScore - secondCandidate.TotalScore;

        var shouldAskDisambiguation = topCandidate.ConfidenceBand == ClassificationConfidenceBand.Low ||
                                      (secondCandidate != null && margin < 10m);

        return new PathwayClassificationResult
        {
            NormalizedComplaintText = normalizedComplaint.NormalizedText,
            Candidates = candidates,
            SelectedPathwayId = topCandidate.PathwayId,
            LikelyPathwayIds = candidates.Select(item => item.PathwayId).ToList(),
            ShouldAskDisambiguation = shouldAskDisambiguation,
            DisambiguationPrompt = shouldAskDisambiguation
                ? "Please clarify the main issue so we can route you correctly."
                : null,
            ConfidenceBand = topCandidate.ConfidenceBand
        };
    }

    private static PathwayClassificationResult BuildNoMatchFallback(NormalizedComplaintText normalizedComplaint)
    {
        var fallbackCandidate = new PathwayClassificationCandidate
        {
            PathwayId = PatientIntakeConstants.GeneralFallbackPathwayKey,
            TotalScore = 1,
            ConfidenceBand = ClassificationConfidenceBand.Low,
            MatchedSignals = new List<PathwayClassificationSignal>
            {
                new()
                {
                    SignalType = "fallback",
                    MatchedTerm = "no_strong_entry_match",
                    Weight = 1
                }
            }
        };

        return new PathwayClassificationResult
        {
            NormalizedComplaintText = normalizedComplaint.NormalizedText,
            Candidates = new List<PathwayClassificationCandidate> { fallbackCandidate },
            SelectedPathwayId = fallbackCandidate.PathwayId,
            LikelyPathwayIds = new List<string> { fallbackCandidate.PathwayId },
            ShouldAskDisambiguation = true,
            DisambiguationPrompt = "We could not confidently identify the complaint category. Please describe your main concern in one sentence.",
            ConfidenceBand = ClassificationConfidenceBand.Low
        };
    }

    private static void ApplyConfidence(IReadOnlyList<PathwayClassificationCandidate> candidates)
    {
        if (candidates.Count == 0)
        {
            return;
        }

        var topScore = candidates[0].TotalScore;
        var secondScore = candidates.Count > 1 ? candidates[1].TotalScore : 0m;
        var margin = topScore - secondScore;

        for (var index = 0; index < candidates.Count; index++)
        {
            var candidate = candidates[index];
            candidate.ConfidenceBand = ResolveConfidence(candidate.TotalScore, margin, index);
        }
    }

    private static ClassificationConfidenceBand ResolveConfidence(decimal score, decimal topMargin, int rank)
    {
        if (rank == 0)
        {
            if (score >= 45m && topMargin >= 12m)
            {
                return ClassificationConfidenceBand.High;
            }

            if (score >= 25m)
            {
                return ClassificationConfidenceBand.Medium;
            }
        }

        if (score >= 25m && rank <= 1)
        {
            return ClassificationConfidenceBand.Medium;
        }

        return ClassificationConfidenceBand.Low;
    }
}
