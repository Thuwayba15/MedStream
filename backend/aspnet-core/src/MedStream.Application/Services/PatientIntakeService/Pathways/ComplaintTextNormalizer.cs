using Abp.Dependency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Normalizes patient complaint text for deterministic pathway classification.
/// </summary>
public interface IComplaintTextNormalizer
{
    /// <summary>
    /// Normalizes free text and symptom lists to canonical text and tokens.
    /// </summary>
    NormalizedComplaintText Normalize(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms);
}

/// <summary>
/// Deterministic complaint text normalizer with phrase canonicalization.
/// </summary>
public class ComplaintTextNormalizer : IComplaintTextNormalizer, ITransientDependency
{
    private static readonly IReadOnlyDictionary<string, string> CanonicalPhraseMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { "can't breathe properly", "difficulty breathing" },
        { "cannot breathe properly", "difficulty breathing" },
        { "short of breath", "shortness of breath" },
        { "breathless", "difficulty breathing" },
        { "tight chest", "chest tightness" },
        { "phlegm", "sputum" },
        { "passed out", "collapse" },
        { "fainted", "collapse" }
    };

    /// <inheritdoc />
    public NormalizedComplaintText Normalize(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        var combined = string.Join(" ",
            new[]
            {
                freeText ?? string.Empty,
                string.Join(" ", selectedSymptoms ?? Array.Empty<string>()),
                string.Join(" ", extractedPrimarySymptoms ?? Array.Empty<string>())
            });

        var normalized = NormalizeWhitespace(NormalizePunctuation(combined.ToLowerInvariant().Trim()));
        foreach (var pair in CanonicalPhraseMap)
        {
            normalized = ReplaceWholePhrase(normalized, pair.Key.ToLowerInvariant(), pair.Value.ToLowerInvariant());
        }

        return new NormalizedComplaintText
        {
            NormalizedText = normalized,
            Tokens = Tokenize(normalized)
        };
    }

    private static string NormalizePunctuation(string input)
    {
        var punctuationNormalized = Regex.Replace(input ?? string.Empty, "[^a-z0-9\\s]", " ");
        return punctuationNormalized;
    }

    private static string NormalizeWhitespace(string input)
    {
        return Regex.Replace(input ?? string.Empty, "\\s+", " ").Trim();
    }

    private static string ReplaceWholePhrase(string text, string phrase, string replacement)
    {
        if (string.IsNullOrWhiteSpace(phrase))
        {
            return text;
        }

        return Regex.Replace(text, $"\\b{Regex.Escape(phrase)}\\b", replacement, RegexOptions.IgnoreCase);
    }

    private static HashSet<string> Tokenize(string text)
    {
        return Regex.Matches(text ?? string.Empty, "[a-z0-9]+", RegexOptions.IgnoreCase)
            .Select(item => item.Value.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
