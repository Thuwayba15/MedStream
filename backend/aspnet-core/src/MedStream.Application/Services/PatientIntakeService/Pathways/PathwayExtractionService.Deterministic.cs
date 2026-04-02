using Castle.Core.Logging;
using MedStream.PatientIntake.Dto;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

public partial class PathwayExtractionService
{
    private List<string> ExtractDeterministicSymptoms(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var normalized = (freeText ?? string.Empty).ToLowerInvariant();
        var detected = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in GenericKeywordSymptomMap)
        {
            if (normalized.Contains(entry.Key, StringComparison.OrdinalIgnoreCase))
            {
                detected.Add(entry.Value);
            }
        }

        foreach (var symptom in selectedSymptoms ?? Array.Empty<string>())
        {
            if (!string.IsNullOrWhiteSpace(symptom))
            {
                detected.Add(symptom.Trim());
            }
        }

        if (detected.Count == 0 && !string.IsNullOrWhiteSpace(freeText))
        {
            detected.Add("General Illness");
        }

        return detected.Take(3).ToList();
    }

    private async Task<Dictionary<string, object>> TryMapInputsWithOpenAiAsync(string pathwayId, string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new Dictionary<string, object>();
        }

        var pathway = _definitionProvider.GetById(pathwayId);
        var inputs = pathway.Inputs
            .Where(item => string.Equals(item.Stage, "patient_intake", StringComparison.OrdinalIgnoreCase))
            .Where(item => string.Equals(item.EnteredBy, "patient", StringComparison.OrdinalIgnoreCase))
            .Select(item => new { item.Id, item.Label, item.Type, item.Required })
            .ToList();

        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";
        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var userText = $"Pathway: {pathwayId}\nFree text: {freeText}\nSelected symptoms: {string.Join(", ", selectedSymptoms)}\nInputs: {JsonConvert.SerializeObject(inputs)}";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var payload = new
        {
            model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Map patient free-text intake to pathway input keys without clinical diagnosis. Return JSON only: {\"mappedInputs\": {\"inputId\": value}}. Use booleans/numbers/strings/arrays. Omit uncertain fields."
                },
                new
                {
                    role = "user",
                    content = userText
                }
            }
        };

        try
        {
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                return new Dictionary<string, object>();
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            var completionContent = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(completionContent))
            {
                return new Dictionary<string, object>();
            }

            using var mappingDoc = JsonDocument.Parse(completionContent);
            if (!mappingDoc.RootElement.TryGetProperty("mappedInputs", out var mapped) || mapped.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, object>();
            }

            var result = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in mapped.EnumerateObject())
            {
                result[property.Name] = JsonElementToObject(property.Value);
            }

            return result;
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    private Dictionary<string, object> MapInputsDeterministically(string pathwayId, string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var pathway = _definitionProvider.GetById(pathwayId);
        var mapped = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        var normalizedText = (freeText ?? string.Empty).ToLowerInvariant();
        var selectedSet = new HashSet<string>((selectedSymptoms ?? Array.Empty<string>()).Select(item => item.ToLowerInvariant()));

        foreach (var input in pathway.Inputs
                     .Where(item => string.Equals(item.Stage, "patient_intake", StringComparison.OrdinalIgnoreCase))
                     .Where(item => string.Equals(item.EnteredBy, "patient", StringComparison.OrdinalIgnoreCase)))
        {
            if (string.Equals(input.Type, "boolean", StringComparison.OrdinalIgnoreCase))
            {
                var labelTokens = Tokenize(input.Label);
                var idTokens = Tokenize(input.Id);
                var allTokens = labelTokens.Union(idTokens).ToList();
                if (allTokens.Count == 0)
                {
                    continue;
                }

                if (allTokens.Any(token => normalizedText.Contains(token, StringComparison.OrdinalIgnoreCase)) ||
                    allTokens.Any(token => selectedSet.Contains(token)))
                {
                    mapped[input.Id] = true;
                }
            }

            if (string.Equals(input.Type, "number", StringComparison.OrdinalIgnoreCase) &&
                (input.Id.Contains("duration", StringComparison.OrdinalIgnoreCase) ||
                 input.Label.Contains("how long", StringComparison.OrdinalIgnoreCase)))
            {
                var duration = ExtractDurationNumber(normalizedText, input.Id);
                if (duration.HasValue)
                {
                    mapped[input.Id] = duration.Value;
                }
            }
        }

        return mapped;
    }

    private static decimal? ExtractDurationNumber(string normalizedText, string inputId)
    {
        var match = Regex.Match(normalizedText ?? string.Empty, "(\\d+)\\s*(day|days|week|weeks|month|months)");
        if (!match.Success || !decimal.TryParse(match.Groups[1].Value, out var value))
        {
            return null;
        }

        if (inputId.Contains("week", StringComparison.OrdinalIgnoreCase))
        {
            return match.Groups[2].Value.StartsWith("day", StringComparison.OrdinalIgnoreCase)
                ? Math.Max(1, decimal.Round(value / 7, 0))
                : value;
        }

        if (inputId.Contains("day", StringComparison.OrdinalIgnoreCase))
        {
            return match.Groups[2].Value.StartsWith("week", StringComparison.OrdinalIgnoreCase)
                ? value * 7
                : value;
        }

        return value;
    }

    private static IEnumerable<string> Tokenize(string text)
    {
        return Regex.Matches(text ?? string.Empty, "[a-z0-9]+", RegexOptions.IgnoreCase)
            .Select(item => item.Value.ToLowerInvariant());
    }

    private static object JsonElementToObject(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Number when element.TryGetInt64(out var integerValue) => integerValue,
            JsonValueKind.Number when element.TryGetDecimal(out var decimalValue) => decimalValue,
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Array => element.EnumerateArray().Select(JsonElementToObject).ToList(),
            JsonValueKind.Object => element.EnumerateObject().ToDictionary(item => item.Name, item => JsonElementToObject(item.Value)),
            _ => element.ToString()
        };
    }

    private string GetOpenAiSetting(string key)
    {
        return _configuration?[key];
    }
}
