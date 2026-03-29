using Abp.Dependency;
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

/// <summary>
/// Extraction output used to drive pathway selection and input pre-mapping.
/// </summary>
public class PathwayExtractionResult
{
    /// <summary>
    /// Gets or sets extracted primary symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extraction source.
    /// </summary>
    public string ExtractionSource { get; set; }

    /// <summary>
    /// Gets or sets likely pathway ids ranked by classifier.
    /// </summary>
    public List<string> LikelyPathwayIds { get; set; } = new();

    /// <summary>
    /// Gets or sets ranked pathway classification candidates.
    /// </summary>
    public List<PathwayClassificationCandidate> Candidates { get; set; } = new();

    /// <summary>
    /// Gets or sets selected pathway id.
    /// </summary>
    public string SelectedPathwayId { get; set; }

    /// <summary>
    /// Gets or sets selected intake mode (approved_json or apc_fallback).
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets whether disambiguation prompt is recommended.
    /// </summary>
    public bool ShouldAskDisambiguation { get; set; }

    /// <summary>
    /// Gets or sets disambiguation prompt when confidence is low.
    /// </summary>
    public string DisambiguationPrompt { get; set; }

    /// <summary>
    /// Gets or sets overall classification confidence.
    /// </summary>
    public string ConfidenceBand { get; set; }

    /// <summary>
    /// Gets or sets selected APC catalog sections for fallback retrieval.
    /// </summary>
    public List<string> FallbackSectionIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected APC summaries for fallback question generation.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets mapped pathway input values inferred from intake text.
    /// </summary>
    public Dictionary<string, object> MappedInputValues { get; set; } = new();
}

/// <summary>
/// Contract for generic intake extraction and pathway selection.
/// </summary>
public interface IPathwayExtractionService
{
    /// <summary>
    /// Extracts symptoms, classifies pathways, and maps input values.
    /// </summary>
    Task<PathwayExtractionResult> ExtractAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms);
}

/// <summary>
/// Generic extraction service decoupled from specific pathway clinical logic.
/// </summary>
public class PathwayExtractionService : IPathwayExtractionService, ITransientDependency
{
    private static readonly Dictionary<string, string> GenericKeywordSymptomMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "cough", "Cough" },
        { "fever", "Fever" },
        { "temperature", "Fever" },
        { "chills", "Fever" },
        { "breath", "Difficulty Breathing" },
        { "breathing", "Difficulty Breathing" },
        { "chest", "Chest Pain" },
        { "pain", "Pain" },
        { "swollen", "Swelling" },
        { "swelling", "Swelling" },
        { "fall", "Injury" },
        { "injury", "Injury" },
        { "dizzy", "Dizziness" },
        { "nausea", "Nausea" },
        { "headache", "Headache" },
        { "fatigue", "Fatigue" }
    };

    private readonly IConfiguration _configuration;
    private readonly IPathwayDefinitionProvider _definitionProvider;
    private readonly IPathwayClassifier _pathwayClassifier;
    private readonly IApcFallbackRoutingService _apcFallbackRoutingService;

    /// <summary>
    /// Gets or sets logger.
    /// </summary>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="PathwayExtractionService"/> class.
    /// </summary>
    public PathwayExtractionService(
        IPathwayDefinitionProvider definitionProvider,
        IPathwayClassifier pathwayClassifier,
        IApcFallbackRoutingService apcFallbackRoutingService,
        IConfiguration configuration = null)
    {
        _configuration = configuration;
        _definitionProvider = definitionProvider;
        _pathwayClassifier = pathwayClassifier;
        _apcFallbackRoutingService = apcFallbackRoutingService;
        Logger = NullLogger.Instance;
    }

    /// <inheritdoc />
    public async Task<PathwayExtractionResult> ExtractAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        Logger.Info($"[Intake][Extract] Start. freeTextLength={(freeText ?? string.Empty).Length}, selectedSymptomsCount={selectedSymptoms?.Count ?? 0}");
        var extractedSymptoms = ExtractDeterministicSymptoms(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());
        var extractionSource = PatientIntakeConstants.ExtractionSourceDeterministicFallback;
        Logger.Info($"[Intake][Extract] Deterministic extracted: {string.Join(", ", extractedSymptoms)}");
        if (extractedSymptoms.Count == 0 || (extractedSymptoms.Count == 1 && string.Equals(extractedSymptoms[0], "General Illness", StringComparison.OrdinalIgnoreCase)))
        {
            Logger.Info("[Intake][Extract] Deterministic signal low; attempting AI symptom extraction.");
            var aiExtractedSymptoms = await TryExtractSymptomsWithOpenAiAsync(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());
            if (aiExtractedSymptoms != null && aiExtractedSymptoms.Count > 0)
            {
                extractedSymptoms = aiExtractedSymptoms;
                extractionSource = PatientIntakeConstants.ExtractionSourceAi;
                Logger.Info($"[Intake][Extract] AI extraction used: {string.Join(", ", extractedSymptoms)}");
            }
            else
            {
                Logger.Warn("[Intake][Extract] AI extraction unavailable/empty. Falling back to deterministic extraction.");
            }
        }

        var classification = _pathwayClassifier.ClassifyLikelyPathways(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>(), extractedSymptoms);
        var likelyPathwayIds = classification.LikelyPathwayIds ?? new List<string>();
        var selectedPathwayId = ResolvePrimaryPathway(classification);
        var intakeMode = ResolveIntakeMode(classification, selectedPathwayId);
        var fallbackRouting = intakeMode == PatientIntakeConstants.IntakeModeApcFallback
            ? _apcFallbackRoutingService.Resolve(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>(), extractedSymptoms)
            : new ApcFallbackContext();
        Logger.Info($"[Intake][Extract] Classification selectedPathway={selectedPathwayId}, intakeMode={intakeMode}, confidence={classification.ConfidenceBand}, candidates={classification.Candidates.Count}, fallbackSummaries={string.Join(", ", fallbackRouting.SummaryIds)}");
        var mappedValues = await MapInputsForPathwayAsync(selectedPathwayId, freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());

        return new PathwayExtractionResult
        {
            ExtractedPrimarySymptoms = extractedSymptoms,
            ExtractionSource = extractionSource,
            LikelyPathwayIds = likelyPathwayIds,
            Candidates = classification.Candidates,
            SelectedPathwayId = selectedPathwayId,
            IntakeMode = intakeMode,
            ShouldAskDisambiguation = classification.ShouldAskDisambiguation,
            DisambiguationPrompt = classification.DisambiguationPrompt,
            ConfidenceBand = classification.ConfidenceBand.ToString(),
            FallbackSectionIds = fallbackRouting.SectionIds,
            FallbackSummaryIds = fallbackRouting.SummaryIds,
            MappedInputValues = mappedValues
        };
    }

    private static string ResolvePrimaryPathway(PathwayClassificationResult classification)
    {
        var selectedPathwayId = string.IsNullOrWhiteSpace(classification.SelectedPathwayId)
            ? PatientIntakeConstants.DefaultPathwayKey
            : classification.SelectedPathwayId;

        if (classification.ConfidenceBand == ClassificationConfidenceBand.Low || classification.ShouldAskDisambiguation)
        {
            return PatientIntakeConstants.GeneralFallbackPathwayKey;
        }

        return selectedPathwayId;
    }

    private static string ResolveIntakeMode(PathwayClassificationResult classification, string selectedPathwayId)
    {
        if (string.Equals(selectedPathwayId, PatientIntakeConstants.GeneralFallbackPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            return PatientIntakeConstants.IntakeModeApcFallback;
        }

        if (classification.ConfidenceBand == ClassificationConfidenceBand.Low || classification.ShouldAskDisambiguation)
        {
            return PatientIntakeConstants.IntakeModeApcFallback;
        }

        return PatientIntakeConstants.IntakeModeApprovedJson;
    }

    private async Task<Dictionary<string, object>> MapInputsForPathwayAsync(string pathwayId, string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var mappedWithAi = await TryMapInputsWithOpenAiAsync(pathwayId, freeText, selectedSymptoms);
        if (mappedWithAi.Count > 0)
        {
            return mappedWithAi;
        }

        return MapInputsDeterministically(pathwayId, freeText, selectedSymptoms);
    }

    private async Task<List<string>> TryExtractSymptomsWithOpenAiAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            Logger.Warn("[Intake][Extract] OPENAI_API_KEY missing; skipping AI extraction.");
            return null;
        }

        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";
        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var userText = $"{freeText}\nSelected: {string.Join(", ", selectedSymptoms ?? Array.Empty<string>())}";

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
                    content = "Extract up to three primary medical symptoms from patient text. Return JSON only with key primarySymptoms as an array of short strings."
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
                Logger.Warn($"[Intake][Extract] AI extraction HTTP failure. statusCode={(int)response.StatusCode}.");
                return null;
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
                return null;
            }

            using var extractionDoc = JsonDocument.Parse(completionContent);
            if (!extractionDoc.RootElement.TryGetProperty("primarySymptoms", out var symptomsElement) || symptomsElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var extracted = symptomsElement.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(3)
                .ToList();

            return extracted.Count == 0 ? null : extracted;
        }
        catch (Exception exception)
        {
            Logger.Warn($"[Intake][Extract] AI extraction exception: {exception.Message}");
            return null;
        }
    }

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
