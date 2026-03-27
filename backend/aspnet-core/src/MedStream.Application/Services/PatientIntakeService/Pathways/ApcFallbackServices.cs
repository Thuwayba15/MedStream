using Abp.Dependency;
using Castle.Core.Logging;
using MedStream.PatientIntake.Dto;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Routing context for APC fallback mode.
/// </summary>
public class ApcFallbackContext
{
    /// <summary>
    /// Gets or sets selected APC catalog section ids.
    /// </summary>
    public List<string> SectionIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected APC summary ids.
    /// </summary>
    public List<string> SummaryIds { get; set; } = new();
}

/// <summary>
/// Contract for APC fallback retrieval routing.
/// </summary>
public interface IApcFallbackRoutingService
{
    /// <summary>
    /// Selects relevant APC catalog sections and summaries for fallback mode.
    /// </summary>
    ApcFallbackContext Resolve(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms);
}

/// <summary>
/// Contract for APC summary-backed fallback question generation.
/// </summary>
public interface IApcFallbackQuestionService
{
    /// <summary>
    /// Generates temporary subjective intake questions from APC summaries.
    /// </summary>
    Task<List<IntakeQuestionDto>> GenerateQuestionsAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms, IReadOnlyCollection<string> summaryIds);
}

/// <summary>
/// Deterministic APC retrieval router for fallback mode.
/// </summary>
public class ApcFallbackRoutingService : IApcFallbackRoutingService, ITransientDependency
{
    private readonly IApcCatalogProvider _catalogProvider;
    private readonly IApcSummaryProvider _summaryProvider;
    private readonly IComplaintTextNormalizer _normalizer;

    /// <summary>
    /// Gets or sets logger.
    /// </summary>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApcFallbackRoutingService"/> class.
    /// </summary>
    public ApcFallbackRoutingService(
        IApcCatalogProvider catalogProvider,
        IApcSummaryProvider summaryProvider,
        IComplaintTextNormalizer normalizer)
    {
        _catalogProvider = catalogProvider;
        _summaryProvider = summaryProvider;
        _normalizer = normalizer;
        Logger = NullLogger.Instance;
    }

    /// <inheritdoc />
    public ApcFallbackContext Resolve(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        Logger.Info($"[Intake][APC-Routing] Start. freeTextLength={(freeText ?? string.Empty).Length}, selectedSymptomsCount={selectedSymptoms?.Count ?? 0}, extractedCount={extractedPrimarySymptoms?.Count ?? 0}");
        var normalized = _normalizer.Normalize(freeText, selectedSymptoms, extractedPrimarySymptoms);
        var entrySections = _catalogProvider.GetAllSections()
            .Where(item => item.IsEntryPathway)
            .Select(item => new
            {
                Section = item,
                Score = ScoreSection(item, normalized)
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Section.Id, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        var sectionIds = entrySections.Select(item => item.Section.Id).ToList();
        var allSummaries = _summaryProvider.GetAllSummaries();
        var summaryIds = allSummaries
            .Select(item => new
            {
                Summary = item,
                Score = ScoreSummary(item, normalized, sectionIds)
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Summary.Id, StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .Select(item => item.Summary.Id)
            .ToList();

        if (summaryIds.Count == 0)
        {
            summaryIds = allSummaries.Take(1).Select(item => item.Id).ToList();
        }

        Logger.Info($"[Intake][APC-Routing] Selected sections={string.Join(", ", sectionIds)}; summaries={string.Join(", ", summaryIds)}");

        return new ApcFallbackContext
        {
            SectionIds = sectionIds,
            SummaryIds = summaryIds
        };
    }

    private static decimal ScoreSection(ApcCatalogSectionJson section, NormalizedComplaintText normalized)
    {
        var score = 0m;
        foreach (var keyword in section.Keywords ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                score += 8m;
            }
        }

        foreach (var bodyRegion in section.BodyRegions ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(bodyRegion, StringComparison.OrdinalIgnoreCase))
            {
                score += 4m;
            }
        }

        if (!string.IsNullOrWhiteSpace(section.SymptomCategory) &&
            normalized.NormalizedText.Contains(section.SymptomCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 6m;
        }

        return score;
    }

    private static decimal ScoreSummary(ApcSummaryJson summary, NormalizedComplaintText normalized, IReadOnlyCollection<string> sectionIds)
    {
        var score = 0m;
        if (sectionIds.Contains(summary.Id, StringComparer.OrdinalIgnoreCase))
        {
            score += 20m;
        }

        foreach (var cue in summary.ComplaintCues ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(cue, StringComparison.OrdinalIgnoreCase))
            {
                score += 6m;
            }
        }

        if (!string.IsNullOrWhiteSpace(summary.SymptomCategory) &&
            normalized.NormalizedText.Contains(summary.SymptomCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 5m;
        }

        return score;
    }
}

/// <summary>
/// APC summary-backed fallback question generator.
/// </summary>
public class ApcFallbackQuestionService : IApcFallbackQuestionService, ITransientDependency
{
    private readonly IConfiguration _configuration;
    private readonly IApcSummaryProvider _summaryProvider;

    /// <summary>
    /// Gets or sets logger.
    /// </summary>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApcFallbackQuestionService"/> class.
    /// </summary>
    public ApcFallbackQuestionService(IApcSummaryProvider summaryProvider, IConfiguration configuration = null)
    {
        _configuration = configuration;
        _summaryProvider = summaryProvider;
        Logger = NullLogger.Instance;
    }

    /// <inheritdoc />
    public async Task<List<IntakeQuestionDto>> GenerateQuestionsAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms, IReadOnlyCollection<string> summaryIds)
    {
        var summaries = _summaryProvider.GetByIds(summaryIds);
        Logger.Info($"[Intake][APC-Questions] Generating fallback questions. summaryIds={string.Join(", ", summaryIds ?? Array.Empty<string>())}, summaryCount={summaries.Count}");
        var aiQuestions = await TryGenerateWithOpenAiAsync(freeText, selectedSymptoms, extractedPrimarySymptoms, summaries);
        if (aiQuestions.Count > 0)
        {
            Logger.Info($"[Intake][APC-Questions] AI question generation succeeded. questionCount={aiQuestions.Count}");
            return aiQuestions;
        }

        Logger.Warn("[Intake][APC-Questions] AI question generation unavailable/empty. Using deterministic fallback questions.");
        return GenerateDeterministicFallbackQuestions(summaries);
    }

    private async Task<List<IntakeQuestionDto>> TryGenerateWithOpenAiAsync(
        string freeText,
        IReadOnlyCollection<string> selectedSymptoms,
        IReadOnlyCollection<string> extractedPrimarySymptoms,
        IReadOnlyCollection<ApcSummaryJson> summaries)
    {
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            Logger.Warn("[Intake][APC-Questions] OPENAI_API_KEY missing; skipping AI fallback question generation.");
            return new List<IntakeQuestionDto>();
        }

        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";
        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var maxQuestions = summaries.Select(item => item.AiFallbackGuidance?.MaxQuestions ?? 6).DefaultIfEmpty(6).Min();
        var promptPayload = new
        {
            freeText,
            selectedSymptoms = selectedSymptoms ?? Array.Empty<string>(),
            extractedPrimarySymptoms = extractedPrimarySymptoms ?? Array.Empty<string>(),
            summaries = summaries.Select(item => new
            {
                item.Id,
                item.Title,
                item.ComplaintCues,
                item.UrgentSubjectiveRedFlags,
                item.CoreSubjectiveQuestions,
                maxQuestions = item.AiFallbackGuidance?.MaxQuestions ?? 6
            }).ToList()
        };

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var requestBody = new
        {
            model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You generate temporary patient subjective intake questions only. Return JSON only with key questions. Each question object must include questionKey, questionText, inputType, isRequired, answerOptions (array). Allowed inputType values: Boolean, SingleSelect, MultiSelect, Number, Text. Ask urgent red flags first. Maximum 6 questions. No diagnosis. No treatment advice."
                },
                new
                {
                    role = "user",
                    content = JsonConvert.SerializeObject(promptPayload)
                }
            }
        };

        try
        {
            var content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                Logger.Warn($"[Intake][APC-Questions] AI HTTP failure. statusCode={(int)response.StatusCode}.");
                return new List<IntakeQuestionDto>();
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            var completion = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(completion))
            {
                return new List<IntakeQuestionDto>();
            }

            using var generatedDoc = JsonDocument.Parse(completion);
            if (!generatedDoc.RootElement.TryGetProperty("questions", out var questionsNode) || questionsNode.ValueKind != JsonValueKind.Array)
            {
                return new List<IntakeQuestionDto>();
            }

            return questionsNode.EnumerateArray()
                .Take(maxQuestions <= 0 ? 6 : maxQuestions)
                .Select((item, index) => BuildQuestion(item, index + 1))
                .Where(item => item != null)
                .ToList();
        }
        catch (Exception exception)
        {
            Logger.Warn($"[Intake][APC-Questions] AI question generation exception: {exception.Message}");
            return new List<IntakeQuestionDto>();
        }
    }

    private static IntakeQuestionDto BuildQuestion(JsonElement questionElement, int order)
    {
        if (!questionElement.TryGetProperty("questionText", out var questionTextNode) ||
            questionTextNode.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var questionText = questionTextNode.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(questionText))
        {
            return null;
        }

        var key = questionElement.TryGetProperty("questionKey", out var keyNode) && keyNode.ValueKind == JsonValueKind.String
            ? keyNode.GetString()
            : $"apcQuestion{order}";
        var inputType = questionElement.TryGetProperty("inputType", out var inputNode) && inputNode.ValueKind == JsonValueKind.String
            ? inputNode.GetString()
            : "Text";
        var isRequired = questionElement.TryGetProperty("isRequired", out var requiredNode) && requiredNode.ValueKind == JsonValueKind.True;

        var options = new List<IntakeQuestionOptionDto>();
        if (questionElement.TryGetProperty("answerOptions", out var optionsNode) && optionsNode.ValueKind == JsonValueKind.Array)
        {
            foreach (var optionNode in optionsNode.EnumerateArray())
            {
                var optionText = optionNode.ValueKind == JsonValueKind.String
                    ? optionNode.GetString()
                    : optionNode.TryGetProperty("label", out var labelNode) ? labelNode.GetString() : null;
                if (string.IsNullOrWhiteSpace(optionText))
                {
                    continue;
                }

                options.Add(new IntakeQuestionOptionDto
                {
                    Value = Slugify(optionText),
                    Label = optionText.Trim()
                });
            }
        }

        return new IntakeQuestionDto
        {
            QuestionKey = string.IsNullOrWhiteSpace(key) ? $"apcQuestion{order}" : key.Trim(),
            QuestionText = questionText,
            InputType = NormalizeInputType(inputType),
            DisplayOrder = order,
            IsRequired = isRequired,
            ShowWhenExpression = null,
            AnswerOptions = options
        };
    }

    private static List<IntakeQuestionDto> GenerateDeterministicFallbackQuestions(IReadOnlyCollection<ApcSummaryJson> summaries)
    {
        var selectedSummary = summaries.FirstOrDefault();
        if (selectedSummary == null)
        {
            return new List<IntakeQuestionDto>
            {
                new()
                {
                    QuestionKey = "fallbackMainConcern",
                    QuestionText = "Please describe your main concern in one sentence.",
                    InputType = "Text",
                    DisplayOrder = 1,
                    IsRequired = true
                },
                new()
                {
                    QuestionKey = "fallbackDangerNow",
                    QuestionText = "Are you struggling to breathe, fainting, or having severe chest pain right now?",
                    InputType = "Boolean",
                    DisplayOrder = 2,
                    IsRequired = true
                }
            };
        }

        var questions = new List<IntakeQuestionDto>();
        var order = 1;
        foreach (var urgentQuestion in (selectedSummary.UrgentSubjectiveRedFlags ?? new List<string>()).Take(3))
        {
            if (string.IsNullOrWhiteSpace(urgentQuestion))
            {
                continue;
            }

            questions.Add(new IntakeQuestionDto
            {
                QuestionKey = $"urgent_{Slugify(urgentQuestion)}",
                QuestionText = urgentQuestion,
                InputType = "Boolean",
                DisplayOrder = order++,
                IsRequired = true
            });
        }

        foreach (var coreQuestion in (selectedSummary.CoreSubjectiveQuestions ?? new List<string>()).Take(3))
        {
            if (string.IsNullOrWhiteSpace(coreQuestion))
            {
                continue;
            }

            questions.Add(new IntakeQuestionDto
            {
                QuestionKey = $"subjective_{Slugify(coreQuestion)}",
                QuestionText = coreQuestion,
                InputType = "Text",
                DisplayOrder = order++,
                IsRequired = false
            });
        }

        if (questions.Count == 0)
        {
            questions.Add(new IntakeQuestionDto
            {
                QuestionKey = "fallbackMainConcern",
                QuestionText = "Please describe your main concern in one sentence.",
                InputType = "Text",
                DisplayOrder = 1,
                IsRequired = true
            });
        }

        return questions.Take(6).ToList();
    }

    private static string NormalizeInputType(string inputType)
    {
        return inputType?.Trim() switch
        {
            "Boolean" => "Boolean",
            "SingleSelect" => "SingleSelect",
            "MultiSelect" => "MultiSelect",
            "Number" => "Number",
            _ => "Text"
        };
    }

    private static string Slugify(string value)
    {
        var text = value?.Trim().ToLowerInvariant() ?? string.Empty;
        text = Regex.Replace(text, "[^a-z0-9]+", "_");
        text = Regex.Replace(text, "_{2,}", "_");
        return text.Trim('_');
    }

    private string GetOpenAiSetting(string key)
    {
        return _configuration?[key];
    }
}
