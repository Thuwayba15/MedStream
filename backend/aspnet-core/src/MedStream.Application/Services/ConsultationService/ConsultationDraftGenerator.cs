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
            "Create a concise clinician-reviewable SOAP subjective draft. Merge intake handoff with transcript updates. Do not diagnose. Never echo raw field keys, booleans, or machine labels. Return JSON with keys source, summary, subjective.",
            new
            {
                context.PathwayName,
                context.ChiefComplaint,
                IntakeSubjective = CleanNarrative(context.IntakeSubjective),
                CurrentSubjective = CleanNarrative(context.CurrentSubjective),
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
            "Create a clinician-reviewable assessment and plan draft from the provided consultation context. Write readable clinical prose for a clinician, not raw machine output. Ground the draft in the provided pathway and APC guidance when available. Use pathway-supported assessment hints and plan suggestions only when the current subjective, objective, transcript, or vitals support them. If evidence is limited, say so explicitly and avoid definitive diagnosis or treatment claims. Never echo raw form keys, booleans, or machine labels. Return JSON with keys source, summary, assessment, plan.",
            new
            {
                context.PathwayId,
                context.PathwayName,
                context.ChiefComplaint,
                CurrentSubjective = CleanNarrative(context.CurrentSubjective),
                CurrentObjective = CleanNarrative(context.CurrentObjective),
                context.UrgencyLevel,
                context.TriageExplanation,
                context.LatestVitalsSummary,
                ObjectiveFocusHints = context.ObjectiveFocusHints,
                PathwayAssessmentHints = context.PathwayAssessmentHints,
                PathwayPlanHints = context.PathwayPlanHints,
                ApcReferenceLinks = context.ApcReferenceLinks,
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
        var cleanedIntakeSubjective = CleanNarrative(context.IntakeSubjective);
        var cleanedCurrentSubjective = CleanNarrative(context.CurrentSubjective);

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(cleanedIntakeSubjective))
        {
            parts.Add(cleanedIntakeSubjective);
        }

        if (!string.IsNullOrWhiteSpace(transcriptSummary))
        {
            parts.Add($"Consultation updates: {transcriptSummary}");
        }

        if (!string.IsNullOrWhiteSpace(cleanedCurrentSubjective))
        {
            parts.Add($"Existing clinician note: {cleanedCurrentSubjective}");
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
        var cleanedSubjective = CleanNarrative(context.CurrentSubjective);
        var cleanedObjective = CleanNarrative(context.CurrentObjective);
        var vitalsSentence = BuildVitalsAssessmentSentence(context.LatestVitalsSummary);
        var assessmentParts = new List<string>();
        var evidenceParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(cleanedSubjective))
        {
            evidenceParts.Add(cleanedSubjective);
        }

        if (!string.IsNullOrWhiteSpace(cleanedObjective))
        {
            evidenceParts.Add($"Objective findings include {TrimEnding(cleanedObjective)}.");
        }
        else if (!string.IsNullOrWhiteSpace(vitalsSentence))
        {
            evidenceParts.Add(vitalsSentence);
        }

        if (evidenceParts.Count > 0)
        {
            assessmentParts.Add(string.Join(" ", evidenceParts));
        }

        if (!string.IsNullOrWhiteSpace(context.PathwayName))
        {
            assessmentParts.Add($"This presentation aligns most closely with the {context.PathwayName} pathway.");
        }

        if (context.PathwayAssessmentHints.Count > 0)
        {
            assessmentParts.Add($"Pathway-supported considerations include {JoinWithAnd(context.PathwayAssessmentHints.Take(2))}, pending clinician confirmation.");
        }
        else if (!string.IsNullOrWhiteSpace(context.UrgencyLevel))
        {
            assessmentParts.Add($"Current triage context remains {context.UrgencyLevel.ToLowerInvariant()}.");
        }

        if (!string.IsNullOrWhiteSpace(context.TriageExplanation))
        {
            assessmentParts.Add($"Triage notes: {TrimEnding(CleanNarrative(context.TriageExplanation))}.");
        }

        var planParts = new List<string>();
        if (context.PathwayPlanHints.Count > 0)
        {
            planParts.Add($"Follow pathway-supported next steps such as {JoinWithAnd(context.PathwayPlanHints.Take(2))}.");
        }

        if (!string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            planParts.Add($"Repeat and document vitals as clinically indicated ({context.LatestVitalsSummary}).");
        }

        if (context.ObjectiveFocusHints.Count > 0)
        {
            planParts.Add($"Complete clinician assessment with focus on {JoinWithAnd(context.ObjectiveFocusHints.Take(3))}.");
        }

        if (planParts.Count == 0)
        {
            planParts.Add("Continue clinician-directed evaluation and management based on the available consultation findings.");
        }

        planParts.Add("Confirm the final diagnosis and treatment steps clinically before completing the visit.");

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = BuildGroundingSummary(context),
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

    private static string CleanNarrative(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var cleanedSections = new List<string>();
        var lines = value
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();

        foreach (var line in lines)
        {
            if (line.StartsWith("Follow-up answers:", StringComparison.OrdinalIgnoreCase))
            {
                var followUpContent = line["Follow-up answers:".Length..].Trim();
                var highlights = followUpContent
                    .Split(';', StringSplitOptions.RemoveEmptyEntries)
                    .Select(item => item.Trim())
                    .Select(BuildReadableFollowUpSegment)
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .ToList();
                if (highlights.Count > 0)
                {
                    cleanedSections.Add($"Key follow-up details: {string.Join("; ", highlights)}.");
                }

                continue;
            }

            if (line.Contains(':'))
            {
                var parts = line.Split(':', 2);
                var label = parts[0].Trim();
                var content = parts[1].Trim();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    cleanedSections.Add($"{label}: {content}.");
                }

                continue;
            }

            cleanedSections.Add(line.EndsWith('.') ? line : $"{line}.");
        }

        return string.Join(" ", cleanedSections).Trim();
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

    private static string BuildVitalsAssessmentSentence(string latestVitalsSummary)
    {
        return string.IsNullOrWhiteSpace(latestVitalsSummary)
            ? string.Empty
            : $"Latest vitals: {latestVitalsSummary}.";
    }

    private static string BuildGroundingSummary(ConsultationDraftContext context)
    {
        var sources = new List<string> { "current consultation notes" };
        if (!string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            sources.Add("latest vitals");
        }

        if (context.PathwayAssessmentHints.Count > 0 || context.PathwayPlanHints.Count > 0)
        {
            sources.Add("pathway guidance");
        }

        if (context.ApcReferenceLinks.Count > 0)
        {
            sources.Add("targeted APC references");
        }

        return $"Draft grounded in {JoinWithAnd(sources)}.";
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
