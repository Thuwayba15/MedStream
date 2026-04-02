#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.QueueOperations;

public partial class QueueOperationsAppService
{
    private static string HumanizeReasoningCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return string.Empty;
        }

        var normalized = code.Replace("_", " ").Replace("-", " ").Trim();
        return char.ToUpperInvariant(normalized[0]) + normalized[1..];
    }

    private static bool TryGetStringAnswer(IReadOnlyDictionary<string, object> answers, string key, out string value)
    {
        value = string.Empty;
        if (answers == null || !answers.TryGetValue(key, out var answer) || answer == null)
        {
            return false;
        }

        value = FormatAnswerValue(answer);
        return !string.IsNullOrWhiteSpace(value);
    }

    private static bool IsPositiveAnswer(object answer)
    {
        if (answer == null)
        {
            return false;
        }

        if (answer is bool booleanValue)
        {
            return booleanValue;
        }

        var text = FormatAnswerValue(answer);
        return !string.IsNullOrWhiteSpace(text) &&
               !string.Equals(text, "false", StringComparison.OrdinalIgnoreCase) &&
               !string.Equals(text, "no", StringComparison.OrdinalIgnoreCase) &&
               !string.Equals(text, "none", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetAnswerLabel(string key)
    {
        return key switch
        {
            "urgentSevereBreathing" => "Severe difficulty breathing reported",
            "urgentSevereChestPain" => "Severe chest pain reported",
            "urgentUncontrolledBleeding" => "Uncontrolled bleeding reported",
            "urgentCollapse" => "Collapse or blackout reported",
            "urgentConfusion" => "Confusion or reduced responsiveness reported",
            "mainConcern" => "Main concern",
            "dangerSigns" => "Danger signs",
            _ => HumanizeReasoningCode(key)
        };
    }

    private static string FormatAnswerValue(object answer)
    {
        if (answer == null)
        {
            return string.Empty;
        }

        if (answer is string stringValue)
        {
            return stringValue.Trim();
        }

        if (answer is IEnumerable<object> objectEnumerable && answer is not string)
        {
            return string.Join(", ", objectEnumerable
                .Select(item => Convert.ToString(item)?.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item)));
        }

        if (answer is System.Collections.IEnumerable enumerable && answer is not string)
        {
            var values = new List<string>();
            foreach (var item in enumerable)
            {
                var value = Convert.ToString(item)?.Trim();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    values.Add(value);
                }
            }

            return string.Join(", ", values);
        }

        return Convert.ToString(answer)?.Trim() ?? string.Empty;
    }

    private string GetOpenAiSetting(string key)
    {
        return _configuration?[key];
    }
}
