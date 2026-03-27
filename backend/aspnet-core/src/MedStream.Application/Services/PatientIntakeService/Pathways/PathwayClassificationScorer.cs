using Abp.Dependency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Contract for deterministic pathway scoring against normalized complaint text.
/// </summary>
public interface IPathwayClassificationScorer
{
    /// <summary>
    /// Scores an entry pathway definition and returns candidate details.
    /// </summary>
    PathwayClassificationCandidate Score(PathwayDefinitionJson pathway, NormalizedComplaintText normalizedComplaint);
}

/// <summary>
/// Deterministic signal-based scorer for entry pathway candidates.
/// </summary>
public class PathwayClassificationScorer : IPathwayClassificationScorer, ITransientDependency
{
    private static readonly IReadOnlyDictionary<string, string[]> SymptomCategoryKeywords = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        { "respiratory", new[] { "cough", "sputum", "breathing", "breath", "chest", "wheeze" } },
        { "injury", new[] { "fall", "injury", "swelling", "fracture", "wound", "hurt", "pain" } },
        { "general", new[] { "sick", "ill", "unwell", "pain", "fever", "weak" } }
    };

    /// <inheritdoc />
    public PathwayClassificationCandidate Score(PathwayDefinitionJson pathway, NormalizedComplaintText normalizedComplaint)
    {
        var candidate = new PathwayClassificationCandidate
        {
            PathwayId = pathway.Id
        };

        var entry = pathway.Entry;
        if (entry == null)
        {
            return candidate;
        }

        AddPhraseSignals(candidate, normalizedComplaint, entry.ComplaintKeywords, "complaint_keyword_exact", 20m);
        AddTokenCoverageSignals(candidate, normalizedComplaint, entry.ComplaintKeywords, "complaint_keyword_token", 8m);
        AddPhraseSignals(candidate, normalizedComplaint, entry.Synonyms, "synonym", 16m);
        AddPhraseSignals(candidate, normalizedComplaint, entry.CommonPhrases, "common_phrase", 14m);
        AddPhraseSignals(candidate, normalizedComplaint, entry.BodyRegions, "body_region", 5m);
        AddCategorySignal(candidate, normalizedComplaint, entry.SymptomCategory);
        AddExcludePenalties(candidate, normalizedComplaint, entry.ExcludePhrases);
        AddPriorityWeight(candidate, entry.Priority);

        candidate.TotalScore = candidate.MatchedSignals.Sum(item => item.Weight);
        return candidate;
    }

    private static void AddPhraseSignals(PathwayClassificationCandidate candidate, NormalizedComplaintText normalizedComplaint, IEnumerable<string> phrases, string signalType, decimal weight)
    {
        foreach (var phrase in phrases ?? Array.Empty<string>())
        {
            if (string.IsNullOrWhiteSpace(phrase))
            {
                continue;
            }

            var normalizedPhrase = NormalizePhrase(phrase);
            if (string.IsNullOrWhiteSpace(normalizedPhrase))
            {
                continue;
            }

            if (!ContainsWholePhrase(normalizedComplaint.NormalizedText, normalizedPhrase))
            {
                continue;
            }

            candidate.MatchedSignals.Add(new PathwayClassificationSignal
            {
                SignalType = signalType,
                MatchedTerm = normalizedPhrase,
                Weight = weight
            });
        }
    }

    private static void AddTokenCoverageSignals(PathwayClassificationCandidate candidate, NormalizedComplaintText normalizedComplaint, IEnumerable<string> phrases, string signalType, decimal weight)
    {
        foreach (var phrase in phrases ?? Array.Empty<string>())
        {
            var tokens = Tokenize(phrase).ToList();
            if (tokens.Count < 2)
            {
                continue;
            }

            if (!tokens.All(token => normalizedComplaint.Tokens.Contains(token)))
            {
                continue;
            }

            candidate.MatchedSignals.Add(new PathwayClassificationSignal
            {
                SignalType = signalType,
                MatchedTerm = NormalizePhrase(phrase),
                Weight = weight
            });
        }
    }

    private static void AddCategorySignal(PathwayClassificationCandidate candidate, NormalizedComplaintText normalizedComplaint, string symptomCategory)
    {
        if (string.IsNullOrWhiteSpace(symptomCategory))
        {
            return;
        }

        if (!SymptomCategoryKeywords.TryGetValue(symptomCategory, out var categoryKeywords))
        {
            return;
        }

        if (!categoryKeywords.Any(keyword => normalizedComplaint.Tokens.Contains(keyword)))
        {
            return;
        }

        candidate.MatchedSignals.Add(new PathwayClassificationSignal
        {
            SignalType = "symptom_category",
            MatchedTerm = symptomCategory,
            Weight = 6m
        });
    }

    private static void AddExcludePenalties(PathwayClassificationCandidate candidate, NormalizedComplaintText normalizedComplaint, IEnumerable<string> excludes)
    {
        foreach (var excludePhrase in excludes ?? Array.Empty<string>())
        {
            if (string.IsNullOrWhiteSpace(excludePhrase))
            {
                continue;
            }

            var normalizedExclude = NormalizePhrase(excludePhrase);
            if (!ContainsWholePhrase(normalizedComplaint.NormalizedText, normalizedExclude))
            {
                continue;
            }

            candidate.MatchedSignals.Add(new PathwayClassificationSignal
            {
                SignalType = "exclude_phrase_penalty",
                MatchedTerm = normalizedExclude,
                Weight = -30m
            });
        }
    }

    private static void AddPriorityWeight(PathwayClassificationCandidate candidate, int priority)
    {
        if (priority <= 0 || priority > 20)
        {
            return;
        }

        var priorityWeight = 6m - Math.Min(priority, 6);
        if (priorityWeight == 0)
        {
            return;
        }

        candidate.MatchedSignals.Add(new PathwayClassificationSignal
        {
            SignalType = "entry_priority",
            MatchedTerm = priority.ToString(),
            Weight = priorityWeight
        });
    }

    private static bool ContainsWholePhrase(string text, string phrase)
    {
        if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(phrase))
        {
            return false;
        }

        return Regex.IsMatch(text, $"\\b{Regex.Escape(phrase)}\\b", RegexOptions.IgnoreCase);
    }

    private static string NormalizePhrase(string phrase)
    {
        var lower = (phrase ?? string.Empty).ToLowerInvariant().Trim();
        return Regex.Replace(lower, "\\s+", " ");
    }

    private static IEnumerable<string> Tokenize(string text)
    {
        return Regex.Matches(text ?? string.Empty, "[a-z0-9]+", RegexOptions.IgnoreCase)
            .Select(item => item.Value.ToLowerInvariant());
    }
}
