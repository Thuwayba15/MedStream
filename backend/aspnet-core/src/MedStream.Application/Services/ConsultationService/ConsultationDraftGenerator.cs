using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MedStream.Consultation;

/// <summary>
/// OpenAI-ready consultation drafting service with deterministic fallback when no API key is configured.
/// </summary>
public class ConsultationDraftGenerator : IConsultationDraftGenerator
{
    private readonly IConfiguration _configuration;

    public ConsultationDraftGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<ConsultationDraftResult> GenerateSubjectiveDraftAsync(ConsultationDraftContext context)
    {
        var fallback = BuildFallbackSubjective(context);
        var aiResult = await TryGenerateJsonAsync(
            "Create a concise clinician-reviewable SOAP subjective draft. Merge intake handoff with transcript updates. Do not diagnose. Return JSON with keys source, summary, subjective.",
            new
            {
                context.ChiefComplaint,
                context.IntakeSubjective,
                context.CurrentSubjective,
                context.UrgencyLevel,
                context.TranscriptSegments
            });

        if (!aiResult.HasValue)
        {
            return fallback;
        }

        var content = aiResult.Value;
        return new ConsultationDraftResult
        {
            Source = ReadString(content, "source", "openai"),
            Summary = ReadString(content, "summary", fallback.Summary),
            Subjective = ReadString(content, "subjective", fallback.Subjective ?? string.Empty)
        };
    }

    public async Task<ConsultationDraftResult> GenerateAssessmentPlanDraftAsync(ConsultationDraftContext context)
    {
        var fallback = BuildFallbackAssessmentPlan(context);
        var aiResult = await TryGenerateJsonAsync(
            "Create a clinician-reviewable assessment and plan draft from the provided consultation context. Be concise, avoid unsupported certainty, and return JSON with keys source, summary, assessment, plan.",
            new
            {
                context.ChiefComplaint,
                context.CurrentSubjective,
                context.CurrentObjective,
                context.CurrentAssessment,
                context.CurrentPlan,
                context.UrgencyLevel,
                context.LatestVitalsSummary,
                context.TranscriptSegments
            });

        if (!aiResult.HasValue)
        {
            return fallback;
        }

        var content = aiResult.Value;
        return new ConsultationDraftResult
        {
            Source = ReadString(content, "source", "openai"),
            Summary = ReadString(content, "summary", fallback.Summary),
            Assessment = ReadString(content, "assessment", fallback.Assessment ?? string.Empty),
            Plan = ReadString(content, "plan", fallback.Plan ?? string.Empty)
        };
    }

    private async Task<JsonElement?> TryGenerateJsonAsync(string systemPrompt, object payload)
    {
        var apiKey = _configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        var endpoint = (_configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var requestBody = new
        {
            model,
            temperature = 0.2,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = JsonConvert.SerializeObject(payload) }
            }
        };

        try
        {
            using var content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var responseDocument = JsonDocument.Parse(responseJson);
            var completionContent = responseDocument.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(completionContent))
            {
                return null;
            }

            using var contentDocument = JsonDocument.Parse(completionContent);
            return contentDocument.RootElement.Clone();
        }
        catch
        {
            return null;
        }
    }

    private static ConsultationDraftResult BuildFallbackSubjective(ConsultationDraftContext context)
    {
        var transcriptSummary = string.Join(" ", context.TranscriptSegments
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Take(3));

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(context.IntakeSubjective))
        {
            parts.Add(context.IntakeSubjective.Trim());
        }

        if (!string.IsNullOrWhiteSpace(transcriptSummary))
        {
            parts.Add($"Consultation updates: {transcriptSummary}");
        }

        if (!string.IsNullOrWhiteSpace(context.CurrentSubjective))
        {
            parts.Add($"Existing clinician note: {context.CurrentSubjective.Trim()}");
        }

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = "Merged intake handoff with available consultation transcript context.",
            Subjective = string.Join("\n\n", parts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim()
        };
    }

    private static ConsultationDraftResult BuildFallbackAssessmentPlan(ConsultationDraftContext context)
    {
        var assessmentParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(context.CurrentSubjective))
        {
            assessmentParts.Add($"Clinical picture based on subjective history: {context.CurrentSubjective.Trim()}");
        }

        if (!string.IsNullOrWhiteSpace(context.CurrentObjective))
        {
            assessmentParts.Add($"Objective findings noted: {context.CurrentObjective.Trim()}");
        }
        else if (!string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            assessmentParts.Add($"Objective findings include vitals: {context.LatestVitalsSummary}");
        }

        if (!string.IsNullOrWhiteSpace(context.UrgencyLevel))
        {
            assessmentParts.Add($"Current triage context remains {context.UrgencyLevel}.");
        }

        var planParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            planParts.Add($"Monitor and document response to care with repeat vitals as needed ({context.LatestVitalsSummary}).");
        }
        else
        {
            planParts.Add("Continue clinician-directed evaluation and management based on examination findings.");
        }

        planParts.Add("Confirm the final assessment and treatment steps clinically before completing the visit.");

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = "Generated a conservative draft from the current consultation context.",
            Assessment = string.Join(" ", assessmentParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim(),
            Plan = string.Join(" ", planParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim()
        };
    }

    private static string ReadString(JsonElement element, string propertyName, string fallbackValue)
    {
        if (element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String)
        {
            var value = property.GetString()?.Trim();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return fallbackValue;
    }
}
