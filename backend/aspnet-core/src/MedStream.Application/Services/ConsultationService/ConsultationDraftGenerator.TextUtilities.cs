using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MedStream.Consultation;

public partial class ConsultationDraftGenerator
{
    private static string CleanNarrative(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var seenSections = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var cleanedSections = new List<string>();
        var lines = value
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();

        foreach (var line in lines)
        {
            var workingLine = line;
            if (workingLine.Contains("[]", StringComparison.Ordinal))
            {
                workingLine = workingLine.Replace("[]", string.Empty, StringComparison.Ordinal).Trim();
            }

            if (workingLine.StartsWith("Follow-up answers:", StringComparison.OrdinalIgnoreCase))
            {
                var followUpContent = workingLine["Follow-up answers:".Length..].Trim();
                var highlights = followUpContent
                    .Split(';', StringSplitOptions.RemoveEmptyEntries)
                    .Select(item => item.Trim())
                    .Select(BuildReadableFollowUpSegment)
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .ToList();
                if (highlights.Count > 0)
                {
                    var summary = $"Key follow-up details: {string.Join("; ", highlights)}.";
                    if (seenSections.Add(summary))
                    {
                        cleanedSections.Add(summary);
                    }
                }

                continue;
            }

            if (workingLine.Contains(':'))
            {
                var parts = workingLine.Split(':', 2);
                var label = HumanizeFreeTextLabel(parts[0].Trim());
                var content = parts[1].Trim();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    var section = $"{label}: {TrimEnding(content)}.";
                    if (seenSections.Add(section))
                    {
                        cleanedSections.Add(section);
                    }
                }

                continue;
            }

            var fallback = workingLine.EndsWith('.') ? workingLine : $"{workingLine}.";
            if (seenSections.Add(fallback))
            {
                cleanedSections.Add(fallback);
            }
        }

        return string.Join("\n", cleanedSections).Trim();
    }

    private static string BuildConciseSubjectiveSummary(string cleanedSubjective)
    {
        if (string.IsNullOrWhiteSpace(cleanedSubjective))
        {
            return string.Empty;
        }

        return BuildSubjectiveNarrative(cleanedSubjective, string.Empty);
    }

    private static string BuildReadableFollowUpSegment(string segment)
    {
        if (string.IsNullOrWhiteSpace(segment))
        {
            return string.Empty;
        }

        var parts = segment.Split(':', 2);
        if (parts.Length != 2)
        {
            return segment;
        }

        var label = HumanizeFollowUpLabel(parts[0].Trim());
        var value = parts[1].Trim();
        if (string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) || string.Equals(value, "yes", StringComparison.OrdinalIgnoreCase))
        {
            return label;
        }

        if (string.Equals(value, "false", StringComparison.OrdinalIgnoreCase) || string.Equals(value, "no", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        return $"{label}: {value}";
    }

    private static string HumanizeFollowUpLabel(string key)
    {
        return key switch
        {
            "urgentSevereBreathing" => "severe difficulty breathing was reported",
            "urgentSevereChestPain" => "severe chest pain was reported",
            "urgentUncontrolledBleeding" => "uncontrolled bleeding was reported",
            "urgentCollapse" => "collapse or blackout was reported",
            "urgentConfusion" => "confusion or reduced responsiveness was reported",
            _ => key
        };
    }

    private static string HumanizeFreeTextLabel(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return string.Empty;
        }

        var humanized = label
            .Replace("Please describe your main concern in one sentence.", "Main concern", StringComparison.OrdinalIgnoreCase)
            .Replace("Select any danger signs now.", "Danger signs reported", StringComparison.OrdinalIgnoreCase);

        var builder = new StringBuilder();
        for (var index = 0; index < humanized.Length; index++)
        {
            var character = humanized[index];
            if (index > 0 && char.IsUpper(character) && humanized[index - 1] != ' ')
            {
                builder.Append(' ');
            }

            builder.Append(character == '_' ? ' ' : character);
        }

        var text = builder.ToString().Trim();
        return string.IsNullOrWhiteSpace(text) ? string.Empty : char.ToUpperInvariant(text[0]) + text[1..];
    }

    private static List<string> ExtractNarrativeHighlights(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new List<string>();
        }

        return value
            .Split(new[] { "\r\n", "\n", "." }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => TrimEnding(item))
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Where(item =>
                !item.StartsWith("Chief complaint", StringComparison.OrdinalIgnoreCase) &&
                !item.StartsWith("Symptoms reported", StringComparison.OrdinalIgnoreCase) &&
                !item.StartsWith("Key follow-up details", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();
    }

    private static string BuildSubjectiveNarrative(string cleanedCurrentSubjective, string cleanedIntakeSubjective)
    {
        var source = !string.IsNullOrWhiteSpace(cleanedCurrentSubjective) ? cleanedCurrentSubjective : cleanedIntakeSubjective;
        if (string.IsNullOrWhiteSpace(source))
        {
            return string.Empty;
        }

        var symptoms = SplitValueList(ExtractSectionValue(source, "Symptoms reported"));
        var mainConcern = NormalizeClinicalPhrase(ExtractSectionValue(source, "Main concern"));
        var onset = NormalizeClinicalPhrase(
            ExtractSectionValue(source, "When did it start") ??
            ExtractSectionValue(source, "Symptom onset") ??
            ExtractSectionValue(source, "How long have you had the cough?"));
        var detailLines = ExtractKeyDetailLines(source)
            .Where(item => !item.StartsWith("Main concern:", StringComparison.OrdinalIgnoreCase))
            .Where(item => !item.StartsWith("When did it start:", StringComparison.OrdinalIgnoreCase))
            .Where(item => !item.StartsWith("Symptom onset:", StringComparison.OrdinalIgnoreCase))
            .Where(item => !item.StartsWith("Symptoms reported:", StringComparison.OrdinalIgnoreCase))
            .Select(NormalizeClinicalPhrase)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Where(item => !symptoms.Any(symptom => string.Equals(symptom, item, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();

        var sentences = new List<string>();
        var openingConcern = !string.IsNullOrWhiteSpace(mainConcern)
            ? mainConcern
            : symptoms.Count > 0
                ? JoinWithAnd(symptoms).ToLowerInvariant()
                : string.Empty;

        if (!string.IsNullOrWhiteSpace(openingConcern) && !string.IsNullOrWhiteSpace(onset))
        {
            sentences.Add($"Patient presents with {openingConcern.ToLowerInvariant()}, which started {onset.ToLowerInvariant()}.");
        }
        else if (!string.IsNullOrWhiteSpace(openingConcern))
        {
            sentences.Add($"Patient presents with {openingConcern.ToLowerInvariant()}.");
        }
        else if (!string.IsNullOrWhiteSpace(onset))
        {
            sentences.Add($"Symptoms started {onset.ToLowerInvariant()}.");
        }

        if (detailLines.Count > 0)
        {
            sentences.Add($"Associated reported features include {JoinWithAnd(detailLines).ToLowerInvariant()}.");
        }

        if (sentences.Count == 0)
        {
            var highlights = ExtractNarrativeHighlights(source);
            if (highlights.Count == 0)
            {
                return TrimEnding(source) + ".";
            }

            return $"The patient reports {JoinWithAnd(highlights).ToLowerInvariant()}.";
        }

        return string.Join(" ", sentences);
    }

    private static string ExtractSectionValue(string source, string label)
    {
        var prefix = $"{label}:";
        var line = source
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .FirstOrDefault(item => item.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(line))
        {
            return string.Empty;
        }

        return line[prefix.Length..].Trim();
    }

    private static List<string> SplitValueList(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new List<string>();
        }

        return value
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(NormalizeClinicalPhrase)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<string> ExtractKeyDetailLines(string source)
    {
        if (string.IsNullOrWhiteSpace(source))
        {
            return new List<string>();
        }

        var lines = source
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();

        var startIndex = lines.FindIndex(item => item.StartsWith("Key details:", StringComparison.OrdinalIgnoreCase) ||
                                                item.StartsWith("Key follow-up details:", StringComparison.OrdinalIgnoreCase));

        if (startIndex < 0)
        {
            return new List<string>();
        }

        return lines
            .Skip(startIndex + 1)
            .Where(item => !item.Contains("[]", StringComparison.Ordinal))
            .ToList();
    }

    private static string NormalizeClinicalPhrase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = TrimEnding(value)
            .Replace("I am", "the patient is", StringComparison.OrdinalIgnoreCase)
            .Replace("I'm", "the patient is", StringComparison.OrdinalIgnoreCase)
            .Replace("I have", "the patient has", StringComparison.OrdinalIgnoreCase)
            .Replace("I've", "the patient has", StringComparison.OrdinalIgnoreCase)
            .Replace("I feel", "the patient feels", StringComparison.OrdinalIgnoreCase)
            .Replace("my ", "their ", StringComparison.OrdinalIgnoreCase)
            .Replace("Pain start", "pain started", StringComparison.OrdinalIgnoreCase)
            .Replace("Body Aches", "body aches", StringComparison.OrdinalIgnoreCase)
            .Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return string.Empty;
        }

        return char.ToLowerInvariant(normalized[0]) + normalized[1..];
    }

    private static string JoinWithAnd(IEnumerable<string> values)
    {
        var items = values.Where(item => !string.IsNullOrWhiteSpace(item)).Select(item => item.Trim()).ToList();
        if (items.Count == 0)
        {
            return string.Empty;
        }

        if (items.Count == 1)
        {
            return items[0];
        }

        if (items.Count == 2)
        {
            return $"{items[0]} and {items[1]}";
        }

        return $"{string.Join(", ", items.Take(items.Count - 1))}, and {items[^1]}";
    }

    private static string TrimEnding(string value)
    {
        return value.Trim().TrimEnd('.', ';');
    }
}
