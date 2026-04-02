#nullable enable
using MedStream.PatientIntake;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

public partial class QueueOperationsAppService
{
    private async Task<string> BuildClinicianSummaryAsync(
        string chiefComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyDictionary<string, object> followUpAnswers,
        string urgencyLevel,
        string triageExplanation,
        IReadOnlyList<string> reasoning)
    {
        var followUpHighlights = BuildFollowUpHighlights(followUpAnswers);
        var fallbackSummary = BuildDeterministicClinicianSummary(
            chiefComplaint,
            selectedSymptoms,
            extractedPrimarySymptoms,
            followUpHighlights,
            urgencyLevel,
            triageExplanation,
            reasoning);
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return fallbackSummary;
        }

        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model,
            temperature = 0.1,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Write a concise clinician-facing intake summary. Return JSON only with key summary. Mention the main complaint, key symptoms, relevant positives, and any urgent context. Do not diagnose. Keep it to 2-4 short sentences."
                },
                new
                {
                    role = "user",
                    content = JsonConvert.SerializeObject(new
                    {
                        chiefComplaint,
                        selectedSymptoms,
                        extractedPrimarySymptoms,
                        followUpHighlights,
                        urgencyLevel,
                        triageExplanation,
                        reasoning
                    })
                }
            }
        };

        try
        {
            using var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                return fallbackSummary;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            var completionContent = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(completionContent))
            {
                return fallbackSummary;
            }

            using var summaryDocument = JsonDocument.Parse(completionContent);
            if (!summaryDocument.RootElement.TryGetProperty("summary", out var summaryElement))
            {
                return fallbackSummary;
            }

            var summary = summaryElement.GetString()?.Trim();
            return string.IsNullOrWhiteSpace(summary) ? fallbackSummary : summary;
        }
        catch
        {
            return fallbackSummary;
        }
    }

    private static string BuildDeterministicClinicianSummary(
        string chiefComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyList<string> followUpHighlights,
        string urgencyLevel,
        string triageExplanation,
        IReadOnlyList<string> reasoning)
    {
        var summaryParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(chiefComplaint))
        {
            summaryParts.Add($"Primary concern: {chiefComplaint.Trim()}.");
        }

        var symptomSource = selectedSymptoms.Count > 0 ? selectedSymptoms : extractedPrimarySymptoms;
        if (symptomSource.Count > 0)
        {
            summaryParts.Add($"Symptoms reported: {string.Join(", ", symptomSource)}.");
        }

        if (followUpHighlights.Count > 0)
        {
            summaryParts.Add($"Key positives: {string.Join("; ", followUpHighlights.Take(3))}.");
        }

        if (!string.IsNullOrWhiteSpace(urgencyLevel))
        {
            summaryParts.Add($"Triage category: {urgencyLevel}.");
        }

        if (!string.IsNullOrWhiteSpace(triageExplanation))
        {
            summaryParts.Add(triageExplanation.Trim().TrimEnd('.') + ".");
        }
        else if (reasoning.Count > 0)
        {
            summaryParts.Add($"Reasoning: {string.Join("; ", reasoning.Take(3))}.");
        }

        return string.Join(" ", summaryParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim();
    }

    private static List<string> BuildFollowUpHighlights(IReadOnlyDictionary<string, object> followUpAnswers)
    {
        return followUpAnswers
            .Where(item => IsPositiveAnswer(item.Value))
            .Select(item => BuildReadableFollowUpHighlight(item.Key, item.Value))
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildReadableFollowUpHighlight(string key, object answer)
    {
        var label = GetAnswerLabel(key);
        if (answer is bool booleanValue)
        {
            return booleanValue ? label : string.Empty;
        }

        var formattedValue = FormatAnswerValue(answer);
        return string.IsNullOrWhiteSpace(formattedValue) ? string.Empty : $"{label}: {formattedValue}";
    }

    private static List<string> BuildReasoningItems(string triageExplanation, string serializedRedFlags, IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var reasoningItems = new List<string>();
        if (!string.IsNullOrWhiteSpace(triageExplanation))
        {
            reasoningItems.Add(triageExplanation.Trim());
        }

        var redFlags = DeserializeStringList(serializedRedFlags);
        reasoningItems.AddRange(redFlags
            .Select(item => MapReasoningCode(item, followUpAnswers))
            .Where(item => !string.IsNullOrWhiteSpace(item)));

        var urgentCheckReasons = new[]
        {
            "urgentSevereBreathing",
            "urgentSevereChestPain",
            "urgentUncontrolledBleeding",
            "urgentCollapse",
            "urgentConfusion"
        }
        .Where(key => GetBooleanAnswer(followUpAnswers, key))
        .Select(GetAnswerLabel);

        reasoningItems.AddRange(urgentCheckReasons);

        return reasoningItems
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildChiefComplaint(
        string freeTextComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyDictionary<string, object> followUpAnswers)
    {
        if (!string.IsNullOrWhiteSpace(freeTextComplaint))
        {
            return freeTextComplaint.Trim();
        }

        if (TryGetStringAnswer(followUpAnswers, "mainConcern", out var mainConcern))
        {
            return mainConcern;
        }

        var urgentComplaint = BuildUrgentChiefComplaint(followUpAnswers);
        if (!string.IsNullOrWhiteSpace(urgentComplaint))
        {
            return urgentComplaint;
        }

        var firstSelectedSymptom = selectedSymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstSelectedSymptom))
        {
            return firstSelectedSymptom.Trim();
        }

        var firstExtractedSymptom = extractedPrimarySymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstExtractedSymptom))
        {
            return firstExtractedSymptom.Trim();
        }

        return string.Empty;
    }

    private static string BuildUrgentChiefComplaint(IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var urgentConcerns = new List<string>();
        if (GetBooleanAnswer(followUpAnswers, "urgentSevereBreathing")) urgentConcerns.Add("Severe breathing difficulty");
        if (GetBooleanAnswer(followUpAnswers, "urgentSevereChestPain")) urgentConcerns.Add("Severe chest pain");
        if (GetBooleanAnswer(followUpAnswers, "urgentUncontrolledBleeding")) urgentConcerns.Add("Uncontrolled bleeding");
        if (GetBooleanAnswer(followUpAnswers, "urgentCollapse")) urgentConcerns.Add("Collapse or blackout");
        if (GetBooleanAnswer(followUpAnswers, "urgentConfusion")) urgentConcerns.Add("Acute confusion");

        return urgentConcerns.Count > 0 ? string.Join(", ", urgentConcerns) : string.Empty;
    }

    private static List<string> DeserializeStringList(string serializedList)
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

    private static Dictionary<string, object> DeserializeAnswerDictionary(string serializedDictionary)
    {
        if (string.IsNullOrWhiteSpace(serializedDictionary))
        {
            return new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            return JsonConvert.DeserializeObject<Dictionary<string, object>>(serializedDictionary)
                   ?? new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private static string MapReasoningCode(string code, IReadOnlyDictionary<string, object> followUpAnswers)
    {
        return code?.Trim() switch
        {
            "global_urgent_check_positive" => BuildUrgentReasoningFromAnswers(followUpAnswers),
            "urgent_global_red_flag" => BuildUrgentReasoningFromAnswers(followUpAnswers),
            "urgent_keyword_detected" => "Complaint text included urgent warning signs.",
            _ => HumanizeReasoningCode(code)
        };
    }

    private static string BuildUrgentReasoningFromAnswers(IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var labels = new[]
        {
            "urgentSevereBreathing",
            "urgentSevereChestPain",
            "urgentUncontrolledBleeding",
            "urgentCollapse",
            "urgentConfusion"
        }
        .Where(key => GetBooleanAnswer(followUpAnswers, key))
        .Select(GetAnswerLabel)
        .ToList();

        return labels.Count > 0
            ? $"Emergency safety checks were positive: {string.Join(", ", labels)}."
            : "Emergency safety checks were positive.";
    }

}
