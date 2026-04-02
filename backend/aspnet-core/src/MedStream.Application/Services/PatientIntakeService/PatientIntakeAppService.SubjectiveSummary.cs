#nullable enable
using MedStream.PatientIntake.Pathways;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MedStream.PatientIntake;

public partial class PatientIntakeAppService
{
    private string BuildSubjectiveSummary(string _, SymptomIntake intake, IReadOnlyDictionary<string, object> answers)
    {
        var selectedSymptoms = DeserializeList(intake.SelectedSymptoms);
        var extractedSymptoms = DeserializeList(intake.ExtractedPrimarySymptoms);
        var combinedSymptoms = selectedSymptoms
            .Concat(extractedSymptoms)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var summaryParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(intake.FreeTextComplaint))
        {
            summaryParts.Add($"Chief complaint: {intake.FreeTextComplaint.Trim()}");
        }

        if (combinedSymptoms.Count > 0)
        {
            summaryParts.Add($"Symptoms reported: {string.Join(", ", combinedSymptoms)}");
        }

        if (answers.Count == 0)
        {
            return string.Join("\n", summaryParts);
        }

        var inputLookup = _pathwayDefinitionProvider.GetAllActive()
            .SelectMany(item => item.Inputs)
            .Where(item => string.Equals(item.Stage, "patient_intake", StringComparison.OrdinalIgnoreCase))
            .GroupBy(item => item.Id, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(item => item.Key, item => item.First().Label, StringComparer.OrdinalIgnoreCase);

        var keyDetails = answers
            .Where(item => ShouldIncludeAnswerInSummary(item.Value))
            .Select(item =>
            {
                var label = inputLookup.TryGetValue(item.Key, out var mappedLabel) ? mappedLabel : HumanizeAnswerKey(item.Key);
                return BuildReadableSummaryAnswer(label, item.Value);
            })
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (keyDetails.Count > 0)
        {
            summaryParts.Add($"Key details: {string.Join(" ", keyDetails)}");
        }

        return string.Join("\n", summaryParts);
    }

    private static List<string> DeserializeList(string serializedList)
    {
        if (string.IsNullOrWhiteSpace(serializedList))
        {
            return new List<string>();
        }

        try
        {
            return JsonConvert.DeserializeObject<List<string>>(serializedList) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static string FormatAnswer(object value)
    {
        if (value is string stringValue)
        {
            return stringValue.Trim();
        }

        if (value is IEnumerable<object> objectList && value is not string)
        {
            return string.Join(", ", objectList
                .Select(FormatAnswerItem)
                .Where(item => !string.IsNullOrWhiteSpace(item) && !string.Equals(item, "none", StringComparison.OrdinalIgnoreCase)));
        }

        if (value is IEnumerable enumerable && value is not string)
        {
            var values = new List<string>();
            foreach (var item in enumerable)
            {
                var text = FormatAnswerItem(item);
                if (!string.IsNullOrWhiteSpace(text) && !string.Equals(text, "none", StringComparison.OrdinalIgnoreCase))
                {
                    values.Add(text);
                }
            }

            return string.Join(", ", values);
        }

        return Convert.ToString(value)?.Trim() ?? string.Empty;
    }

    private static bool ShouldIncludeAnswerInSummary(object value)
    {
        if (value == null)
        {
            return false;
        }

        if (value is bool booleanValue)
        {
            return booleanValue;
        }

        if (value is string stringValue)
        {
            return !string.IsNullOrWhiteSpace(stringValue) &&
                   !string.Equals(stringValue.Trim(), "false", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(stringValue.Trim(), "no", StringComparison.OrdinalIgnoreCase);
        }

        if (value is IEnumerable enumerable && value is not string)
        {
            foreach (var item in enumerable)
            {
                var text = FormatAnswerItem(item);
                if (!string.IsNullOrWhiteSpace(text) && !string.Equals(text, "none", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    private static string BuildReadableSummaryAnswer(string label, object value)
    {
        var safeLabel = label?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(safeLabel))
        {
            return string.Empty;
        }

        if (value is bool booleanValue)
        {
            return booleanValue
                ? (safeLabel.EndsWith(".", StringComparison.Ordinal) ? safeLabel : $"{safeLabel}.")
                : string.Empty;
        }

        var formattedValue = FormatAnswer(value);
        if (string.IsNullOrWhiteSpace(formattedValue))
        {
            return string.Empty;
        }

        return safeLabel switch
        {
            "Main concern" => $"Main concern: {formattedValue}.",
            "Danger signs reported" => $"Danger signs reported: {formattedValue}.",
            _ => $"{safeLabel}: {formattedValue}."
        };
    }

    private static string FormatAnswerItem(object value)
    {
        var text = Convert.ToString(value)?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        return text switch
        {
            "fainting" => "Fainting/collapse",
            "severe-pain" => "Severe pain",
            "breathing" => "Difficulty breathing",
            "cannot-drink" => "Cannot keep fluids down",
            _ => text
        };
    }

    private static string HumanizeAnswerKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return string.Empty;
        }

        var normalizedKey = key.Trim();
        return normalizedKey.ToLowerInvariant() switch
        {
            "urgentseverebreathing" => "Severe difficulty breathing reported",
            "urgentseverechestpain" => "Severe chest pain reported",
            "urgentuncontrolledbleeding" => "Uncontrolled bleeding reported",
            "urgentcollapse" => "Collapse or blackout reported",
            "urgentconfusion" => "Confusion or reduced responsiveness reported",
            "hasfever" => "Fever reported",
            "durationdays" => "Duration",
            "mainconcern" => "Main concern",
            "chiefconcern" => "Main concern",
            "dangersigns" => "Danger signs reported",
            "dizzinesstype" => "Type of dizziness",
            "symptomonset" => "Symptom onset",
            _ => HumanizeFreeFormKey(normalizedKey)
        };
    }

    private static string HumanizeFreeFormKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        for (var index = 0; index < key.Length; index++)
        {
            var character = key[index];
            if (index > 0 && char.IsUpper(character) && key[index - 1] != ' ')
            {
                builder.Append(' ');
            }

            builder.Append(character == '_' ? ' ' : character);
        }

        var text = builder.ToString().Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        text = text
            .Replace("Please describe your main concern in one sentence.", "Main concern", StringComparison.OrdinalIgnoreCase)
            .Replace("Select any danger signs now.", "Danger signs reported", StringComparison.OrdinalIgnoreCase);

        return char.ToUpperInvariant(text[0]) + text[1..];
    }
}
