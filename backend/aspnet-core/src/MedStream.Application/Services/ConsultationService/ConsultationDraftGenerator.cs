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
            "Create a clinician-reviewable SOAP subjective draft. Merge intake handoff with transcript updates. Keep it readable and a bit more complete than a one-line summary. Use short paragraphs or bullet points when helpful. Do not diagnose. Never echo raw field keys, booleans, or machine labels. Return JSON with keys source, summary, subjective.",
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
            "Create a clinician-reviewable assessment and plan draft from the provided consultation context. The assessment must synthesize the clinically meaningful interpretation of the history, objective findings, and vitals; do not simply restate symptom labels or pathway names. Prefer the same level of usefulness as a careful clinician summary, using guarded language such as suggests, may reflect, concerning for, or needs evaluation when certainty is limited. The plan must be an actionable care plan for the current visit, not a generic workflow checklist, and should include focused reassessment, investigations or exam focus, monitoring, and immediate safety actions when supported by the available evidence. Ground the draft in the provided pathway and APC guidance when available, but do not let generic fallback pathway wording dominate the note. Use pathway-supported assessment hints and plan suggestions only when the current subjective, objective, transcript, or vitals support them. If evidence is limited, say so explicitly and avoid definitive diagnosis or treatment claims. Never echo raw form keys, booleans, or machine labels. Return JSON with keys source, summary, assessment, plan.",
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
        var vitalsSummary = TrimEnding(context.LatestVitalsSummary ?? string.Empty);
        var assessmentParts = new List<string>();
        var planParts = new List<string>();
        var isGenericFallbackPathway = string.Equals(context.PathwayId, "general_unspecified_complaint", StringComparison.OrdinalIgnoreCase);
        var conciseSubjective = BuildConciseSubjectiveSummary(cleanedSubjective);
        var objectiveHighlights = ExtractNarrativeHighlights(cleanedObjective);
        var subjectiveHighlights = ExtractNarrativeHighlights(conciseSubjective);
        var triageNote = CleanNarrative(context.TriageExplanation);
        var physiologicInterpretation = BuildPhysiologicInterpretation(context.LatestVitalsSummary);
        var actionPlanHints = BuildActionPlanHints(context.LatestVitalsSummary, cleanedSubjective, cleanedObjective, context.ObjectiveFocusHints);

        assessmentParts.Add("1. Clinical impression");
        if (objectiveHighlights.Count > 0)
        {
            assessmentParts.Add($"- Documented objective findings include {JoinWithAnd(objectiveHighlights)}.");
        }

        if (subjectiveHighlights.Count > 0)
        {
            assessmentParts.Add($"- Current presentation is characterized by {JoinWithAnd(subjectiveHighlights)}.");
        }

        if (string.IsNullOrWhiteSpace(physiologicInterpretation) && objectiveHighlights.Count == 0 && subjectiveHighlights.Count == 0)
        {
            assessmentParts.Add("- Limited clinician-entered evidence is available, so the assessment remains provisional.");
        }

        if (!string.IsNullOrWhiteSpace(vitalsSummary))
        {
            assessmentParts.Add("2. Vitals and physiological context");
            assessmentParts.Add($"- Latest vitals recorded: {vitalsSummary}.");
            if (!string.IsNullOrWhiteSpace(physiologicInterpretation))
            {
                assessmentParts.Add($"- These findings {physiologicInterpretation}.");
            }
        }

        var assessmentHints = context.PathwayAssessmentHints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Where(item => !isGenericFallbackPathway || !item.Contains("general review", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (assessmentHints.Count > 0)
        {
            assessmentParts.Add("3. Supported considerations");
            assessmentParts.Add($"- Based on the documented findings, consider {JoinWithAnd(assessmentHints.Take(3))}, pending clinician confirmation.");
        }
        else if (!string.IsNullOrWhiteSpace(context.PathwayName) && !isGenericFallbackPathway)
        {
            assessmentParts.Add("3. Pathway context");
            assessmentParts.Add($"- The presentation aligns most closely with the {context.PathwayName} pathway, subject to clinician review.");
        }

        if (!string.IsNullOrWhiteSpace(triageNote) &&
            !isGenericFallbackPathway &&
            !triageNote.Contains("General intake captured", StringComparison.OrdinalIgnoreCase))
        {
            assessmentParts.Add("4. Triage note");
            assessmentParts.Add($"- {TrimEnding(triageNote)}.");
        }

        planParts.Add("1. Immediate next steps");
        var planHints = context.PathwayPlanHints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => TrimEnding(item.Trim()))
            .Where(item => !isGenericFallbackPathway || !item.Contains("route to specific pathway", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (actionPlanHints.Count > 0)
        {
            planParts.Add($"   {JoinWithAnd(actionPlanHints.Take(2))}.");
        }
        else if (planHints.Count > 0)
        {
            planParts.Add($"   Follow pathway-supported next steps such as {JoinWithAnd(planHints.Take(2))}.");
        }
        else if (objectiveHighlights.Count > 0)
        {
            planParts.Add($"   Continue management based on the recorded findings, including {JoinWithAnd(objectiveHighlights.Take(3))}, and the patient's current clinical stability.");
        }
        else
        {
            planParts.Add("   Continue clinician-directed evaluation and management based on the available findings.");
        }

        planParts.Add("2. Monitoring and reassessment");
        if (!string.IsNullOrWhiteSpace(vitalsSummary))
        {
            planParts.Add($"   Repeat and document vitals as clinically indicated ({vitalsSummary}).");
        }
        else
        {
            planParts.Add("   Record or repeat vital signs if they are needed to complete the visit assessment.");
        }

        planParts.Add("3. Focused clinical review");
        if (context.ObjectiveFocusHints.Count > 0)
        {
            planParts.Add($"   Complete clinician assessment with focus on {JoinWithAnd(context.ObjectiveFocusHints.Take(3))}.");
        }
        else if (subjectiveHighlights.Count > 0)
        {
            planParts.Add($"   Perform focused review and examination for {JoinWithAnd(subjectiveHighlights.Take(3))}.");
        }
        else if (!string.IsNullOrWhiteSpace(cleanedObjective))
        {
            planParts.Add("   Reassess the documented objective findings and update the note if the examination changes.");
        }
        else
        {
            planParts.Add("   Confirm the key objective findings that will support the final assessment.");
        }

        planParts.Add("4. Final clinician decision");
        planParts.Add("   Confirm the final diagnosis and treatment steps clinically before completing the visit.");

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = BuildGroundingSummary(context),
            Assessment = string.Join("\n", assessmentParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim(),
            Plan = string.Join("\n", planParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim()
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

        var segments = cleanedSubjective
            .Split('.', StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Where(item =>
                !item.StartsWith("Key follow-up details", StringComparison.OrdinalIgnoreCase) &&
                !item.StartsWith("Chief complaint", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (segments.Count == 0)
        {
            return $"{TrimEnding(cleanedSubjective)}.";
        }

        return $"{TrimEnding(segments[0])}.";
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

    private static string BuildPhysiologicInterpretation(string latestVitalsSummary)
    {
        if (string.IsNullOrWhiteSpace(latestVitalsSummary))
        {
            return string.Empty;
        }

        var interpretations = new List<string>();
        var summary = latestVitalsSummary;

        if (TryReadVital(summary, "BP", out var systolic, out var diastolic))
        {
            if (systolic <= 100 || diastolic <= 60)
            {
                interpretations.Add("may reflect low blood pressure contributing to the current symptoms");
            }
            else if (systolic >= 140 || diastolic >= 90)
            {
                interpretations.Add("show elevated blood pressure that should be interpreted with the clinical picture");
            }
        }

        if (TryReadSingleVital(summary, "HR", out var heartRate))
        {
            if (heartRate >= 100)
            {
                interpretations.Add("show tachycardia");
            }
            else if (heartRate < 50)
            {
                interpretations.Add("show bradycardia");
            }
        }

        if (TryReadSingleVital(summary, "RR", out var respiratoryRate))
        {
            if (respiratoryRate > 20)
            {
                interpretations.Add("suggest increased respiratory effort");
            }
        }

        if (TryReadDecimalVital(summary, "Temp", out var temperature))
        {
            if (temperature >= 38m)
            {
                interpretations.Add("suggest fever");
            }
        }

        if (TryReadSingleVital(summary, "SpO2", out var spo2) && spo2 < 95)
        {
            interpretations.Add("show reduced oxygen saturation");
        }

        if (TryReadDecimalVital(summary, "Glucose", out var glucose))
        {
            if (glucose < 3.9m || glucose <= 20m)
            {
                interpretations.Add("show a low glucose reading that should be confirmed urgently and interpreted clinically");
            }
        }

        return JoinWithAnd(interpretations);
    }

    private static List<string> BuildActionPlanHints(string latestVitalsSummary, string cleanedSubjective, string cleanedObjective, IReadOnlyCollection<string> objectiveFocusHints)
    {
        var hints = new List<string>();

        if (TryReadDecimalVital(latestVitalsSummary, "Glucose", out var glucose) && (glucose < 3.9m || glucose <= 20m))
        {
            hints.Add("repeat the glucose measurement promptly and address possible hypoglycaemia if confirmed");
        }

        if (TryReadVital(latestVitalsSummary, "BP", out var systolic, out var diastolic) && (systolic <= 100 || diastolic <= 60))
        {
            hints.Add("recheck blood pressure and assess volume status or orthostatic symptoms if clinically appropriate");
        }

        if (TryReadSingleVital(latestVitalsSummary, "HR", out var heartRate) && heartRate >= 100)
        {
            hints.Add("repeat pulse and reassess for causes of tachycardia in the current presentation");
        }

        if (!string.IsNullOrWhiteSpace(cleanedObjective))
        {
            hints.Add("document any progression or change in the recorded examination findings");
        }

        if (objectiveFocusHints.Count > 0)
        {
            hints.Add($"complete focused examination for {JoinWithAnd(objectiveFocusHints.Take(2))}");
        }

        if (cleanedSubjective.Contains("dizziness", StringComparison.OrdinalIgnoreCase))
        {
            hints.Add("review neurological and cardiovascular causes of dizziness based on the bedside assessment");
        }

        return hints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool TryReadVital(string summary, string label, out int left, out int right)
    {
        left = 0;
        right = 0;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var value = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var parts = value.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 2 &&
               int.TryParse(parts[0].Trim(), out left) &&
               int.TryParse(parts[1].Trim(), out right);
    }

    private static bool TryReadSingleVital(string summary, string label, out int value)
    {
        value = 0;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var rawValue = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var firstToken = rawValue.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return int.TryParse(firstToken, out value);
    }

    private static bool TryReadDecimalVital(string summary, string label, out decimal value)
    {
        value = 0m;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var rawValue = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var firstToken = rawValue.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return decimal.TryParse(firstToken, out value);
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
