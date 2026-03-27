using Abp.Dependency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Keyword-based classifier that ranks likely pathway ids from intake text and extracted symptoms.
/// </summary>
public class PathwayClassifier : IPathwayClassifier, ITransientDependency
{
    private readonly IPathwayDefinitionProvider _definitionProvider;

    /// <summary>
    /// Initializes a new instance of the <see cref="PathwayClassifier"/> class.
    /// </summary>
    public PathwayClassifier(IPathwayDefinitionProvider definitionProvider)
    {
        _definitionProvider = definitionProvider;
    }

    /// <inheritdoc />
    public IReadOnlyList<string> ClassifyLikelyPathways(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        var signalText = BuildSignalText(freeText, selectedSymptoms, extractedPrimarySymptoms);
        var tokens = Tokenize(signalText);
        var scores = new List<(string PathwayId, int Score)>();

        foreach (var pathway in _definitionProvider.GetAllActive())
        {
            var score = 0;
            foreach (var keyword in pathway.Entry?.ComplaintKeywords ?? new List<string>())
            {
                if (string.IsNullOrWhiteSpace(keyword))
                {
                    continue;
                }

                var normalizedKeyword = keyword.Trim().ToLowerInvariant();
                if (signalText.Contains(normalizedKeyword, StringComparison.OrdinalIgnoreCase))
                {
                    score += 6;
                    continue;
                }

                var keywordTokens = Tokenize(normalizedKeyword);
                if (keywordTokens.All(token => tokens.Contains(token)))
                {
                    score += 3;
                }
            }

            if (score > 0)
            {
                scores.Add((pathway.Id, score));
            }
        }

        return scores
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.PathwayId, StringComparer.OrdinalIgnoreCase)
            .Select(item => item.PathwayId)
            .ToList();
    }

    private static string BuildSignalText(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        var parts = new List<string>
        {
            freeText ?? string.Empty
        };

        parts.AddRange(selectedSymptoms ?? Array.Empty<string>());
        parts.AddRange(extractedPrimarySymptoms ?? Array.Empty<string>());

        return string.Join(" ", parts).ToLowerInvariant();
    }

    private static HashSet<string> Tokenize(string text)
    {
        return Regex.Matches(text ?? string.Empty, "[a-z0-9]+", RegexOptions.IgnoreCase)
            .Select(item => item.Value.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
