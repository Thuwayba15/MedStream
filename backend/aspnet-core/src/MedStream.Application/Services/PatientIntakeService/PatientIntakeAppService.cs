using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake.Dto;
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

namespace MedStream.PatientIntake;

/// <summary>
/// Application service implementing the patient intake workflow (check-in, extraction, dynamic questions, and triage).
/// </summary>
[AbpAuthorize]
public class PatientIntakeAppService : MedStreamAppServiceBase, IPatientIntakeAppService
{
    private static readonly Dictionary<string, string> KeywordSymptomMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "cough", "Cough" },
        { "fever", "Fever" },
        { "temperature", "Fever" },
        { "chills", "Fever" },
        { "breath", "Difficulty Breathing" },
        { "breathing", "Difficulty Breathing" },
        { "chest", "Chest Pain" },
        { "sore", "Sore Throat" },
        { "throat", "Sore Throat" },
        { "dizzy", "Dizziness" },
        { "nausea", "Nausea" },
        { "headache", "Headache" },
        { "tired", "Fatigue" },
        { "fatigue", "Fatigue" }
    };

    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<Facility, int> _facilityRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly IConfiguration _configuration;

    public PatientIntakeAppService(
        IRepository<Visit, long> visitRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<Facility, int> facilityRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IConfiguration configuration)
    {
        _visitRepository = visitRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _facilityRepository = facilityRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public async Task<PatientCheckInOutput> CheckIn()
    {
        var user = await EnsureCurrentPatientUserAsync();
        var tenantId = AbpSession.TenantId ?? 1;

        var facility = await _facilityRepository.FirstOrDefaultAsync(item => item.TenantId == tenantId && item.IsActive);
        var visit = new Visit
        {
            TenantId = tenantId,
            PatientUserId = user.Id,
            FacilityId = facility?.Id,
            VisitDate = DateTime.UtcNow,
            Status = PatientIntakeConstants.VisitStatusIntakeInProgress,
            PathwayKey = PatientIntakeConstants.DefaultPathwayKey
        };

        await _visitRepository.InsertAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new PatientCheckInOutput
        {
            VisitId = visit.Id,
            FacilityName = facility?.Name ?? "Assigned Facility",
            StartedAt = visit.VisitDate,
            PathwayKey = visit.PathwayKey
        };
    }

    /// <inheritdoc />
    public async Task<CaptureSymptomsOutput> CaptureSymptoms(CaptureSymptomsInput input)
    {
        if (string.IsNullOrWhiteSpace(input.FreeText) && (input.SelectedSymptoms?.Count ?? 0) == 0)
        {
            throw new UserFriendlyException("Please provide symptom text or select at least one symptom.");
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var intake = await GetOrCreateIntakeAsync(visit.Id, visit.TenantId);

        intake.FreeTextComplaint = input.FreeText?.Trim() ?? string.Empty;
        intake.SelectedSymptoms = SerializeStringList(input.SelectedSymptoms);
        intake.SubmittedAt = DateTime.UtcNow;

        await _symptomIntakeRepository.UpdateAsync(intake);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new CaptureSymptomsOutput
        {
            CapturedAt = intake.SubmittedAt
        };
    }

    /// <inheritdoc />
    public async Task<ExtractSymptomsOutput> ExtractSymptoms(ExtractSymptomsInput input)
    {
        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var intake = await GetOrCreateIntakeAsync(visit.Id, visit.TenantId);

        var extractedSymptoms = await TryExtractWithOpenAiAsync(input.FreeText ?? string.Empty, input.SelectedSymptoms ?? new List<string>());
        var extractionSource = PatientIntakeConstants.ExtractionSourceAi;
        if (extractedSymptoms == null || extractedSymptoms.Count == 0)
        {
            extractedSymptoms = ExtractDeterministic(input.FreeText ?? string.Empty, input.SelectedSymptoms ?? new List<string>());
            extractionSource = PatientIntakeConstants.ExtractionSourceDeterministicFallback;
        }

        intake.ExtractedPrimarySymptoms = SerializeStringList(extractedSymptoms);
        intake.ExtractionSource = extractionSource;
        intake.SubmittedAt = DateTime.UtcNow;

        await _symptomIntakeRepository.UpdateAsync(intake);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new ExtractSymptomsOutput
        {
            ExtractedPrimarySymptoms = extractedSymptoms,
            ExtractionSource = extractionSource
        };
    }

    /// <inheritdoc />
    public Task<GetIntakeQuestionsOutput> GetQuestions(GetIntakeQuestionsInput input)
    {
        if (!string.Equals(input.PathwayKey, PatientIntakeConstants.DefaultPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new GetIntakeQuestionsOutput());
        }

        var questionSet = BuildBaseQuestions();
        var primarySymptom = input.PrimarySymptom?.Trim();
        if (!string.IsNullOrWhiteSpace(primarySymptom))
        {
            var prioritizeRespiratory = primarySymptom.Contains("cough", StringComparison.OrdinalIgnoreCase) ||
                                        primarySymptom.Contains("breathing", StringComparison.OrdinalIgnoreCase);
            if (prioritizeRespiratory)
            {
                questionSet = questionSet
                    .OrderBy(item => item.QuestionKey == "breathingDifficulty" ? 0 : item.DisplayOrder + 1)
                    .Select((item, index) =>
                    {
                        item.DisplayOrder = index + 1;
                        return item;
                    })
                    .ToList();
            }
        }

        return Task.FromResult(new GetIntakeQuestionsOutput
        {
            QuestionSet = questionSet
        });
    }

    /// <inheritdoc />
    public async Task<AssessTriageOutput> AssessTriage(AssessTriageInput input)
    {
        if (input.ExtractedPrimarySymptoms == null || input.ExtractedPrimarySymptoms.Count == 0)
        {
            throw new UserFriendlyException("At least one extracted symptom is required before triage.");
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var triage = ComputeTriage(input.ExtractedPrimarySymptoms, input.Answers ?? new Dictionary<string, object>());
        var queueMessage = BuildQueueStatus(triage.UrgencyLevel);
        var assessedAt = DateTime.UtcNow;

        var triageEntity = new TriageAssessment
        {
            TenantId = visit.TenantId,
            VisitId = visit.Id,
            UrgencyLevel = triage.UrgencyLevel,
            PriorityScore = triage.PriorityScore,
            Explanation = triage.Explanation,
            RedFlagsDetected = SerializeStringList(triage.RedFlags),
            PositionPending = true,
            QueueMessage = queueMessage,
            LastQueueUpdatedAt = assessedAt,
            AssessedAt = assessedAt
        };

        visit.Status = PatientIntakeConstants.VisitStatusTriageCompleted;

        await _triageAssessmentRepository.InsertAsync(triageEntity);
        await _visitRepository.UpdateAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new AssessTriageOutput
        {
            Triage = triage,
            Queue = new QueueStatusDto
            {
                PositionPending = true,
                Message = queueMessage,
                LastUpdatedAt = assessedAt
            }
        };
    }

    private async Task<User> EnsureCurrentPatientUserAsync()
    {
        if (!AbpSession.UserId.HasValue)
        {
            throw new AbpAuthorizationException("Unauthenticated.");
        }

        var userId = AbpSession.UserId.Value;
        var user = await _userRepository.GetAsync(userId);
        var roleNames = await _userManager.GetRolesAsync(user);
        if (!roleNames.Contains("Patient"))
        {
            throw new AbpAuthorizationException("Only patients may access intake endpoints.");
        }

        return user;
    }

    private async Task<Visit> GetVisitForCurrentPatientAsync(long visitId)
    {
        var user = await EnsureCurrentPatientUserAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var visit = await _visitRepository.FirstOrDefaultAsync(item =>
            item.Id == visitId &&
            item.TenantId == tenantId &&
            item.PatientUserId == user.Id &&
            !item.IsDeleted);
        if (visit == null)
        {
            throw new UserFriendlyException("Visit context is invalid or expired.");
        }

        return visit;
    }

    private async Task<SymptomIntake> GetOrCreateIntakeAsync(long visitId, int tenantId)
    {
        var intake = await _symptomIntakeRepository.FirstOrDefaultAsync(item =>
            item.VisitId == visitId &&
            item.TenantId == tenantId &&
            !item.IsDeleted);
        if (intake != null)
        {
            return intake;
        }

        intake = new SymptomIntake
        {
            TenantId = tenantId,
            VisitId = visitId,
            FreeTextComplaint = string.Empty,
            SubmittedAt = DateTime.UtcNow
        };

        await _symptomIntakeRepository.InsertAsync(intake);
        await CurrentUnitOfWork.SaveChangesAsync();
        return intake;
    }

    private static string SerializeStringList(IEnumerable<string> values)
    {
        return JsonConvert.SerializeObject((values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList());
    }

    private static List<string> ExtractDeterministic(string freeText, IEnumerable<string> selectedSymptoms)
    {
        var normalized = (freeText ?? string.Empty).ToLowerInvariant();
        var detected = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in KeywordSymptomMap)
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

    private async Task<List<string>> TryExtractWithOpenAiAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var apiKey = _configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";
        var endpoint = (_configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
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
        catch
        {
            return null;
        }
    }

    private static List<IntakeQuestionDto> BuildBaseQuestions()
    {
        return new List<IntakeQuestionDto>
        {
            new()
            {
                QuestionKey = "durationDays",
                QuestionText = "How many days have these symptoms been present?",
                InputType = "Number",
                DisplayOrder = 1,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "hasFever",
                QuestionText = "Have you had a fever?",
                InputType = "Boolean",
                DisplayOrder = 2,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "temperatureBand",
                QuestionText = "What was your highest measured temperature?",
                InputType = "SingleSelect",
                DisplayOrder = 3,
                IsRequired = true,
                ShowWhenExpression = "answer:hasFever=true",
                AnswerOptions = new List<IntakeQuestionOptionDto>
                {
                    new() { Value = "under-38", Label = "Below 38 C" },
                    new() { Value = "38-39", Label = "38 C to 39 C" },
                    new() { Value = "39-plus", Label = "Above 39 C" }
                }
            },
            new()
            {
                QuestionKey = "breathingDifficulty",
                QuestionText = "Are you currently experiencing difficulty breathing?",
                InputType = "Boolean",
                DisplayOrder = 4,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "chestPain",
                QuestionText = "Do you have chest pain right now?",
                InputType = "Boolean",
                DisplayOrder = 5,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "dangerSymptoms",
                QuestionText = "Select any danger symptoms you currently have.",
                InputType = "MultiSelect",
                DisplayOrder = 6,
                IsRequired = true,
                AnswerOptions = new List<IntakeQuestionOptionDto>
                {
                    new() { Value = "confusion", Label = "Confusion" },
                    new() { Value = "cannot-drink", Label = "Cannot keep fluids down" },
                    new() { Value = "fainting", Label = "Fainting episodes" },
                    new() { Value = "none", Label = "None of the above" }
                }
            },
            new()
            {
                QuestionKey = "chronicCondition",
                QuestionText = "Do you have any chronic condition (asthma, diabetes, heart disease)?",
                InputType = "Boolean",
                DisplayOrder = 7,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "additionalNotes",
                QuestionText = "Anything else we should know before triage?",
                InputType = "Text",
                DisplayOrder = 8,
                IsRequired = false
            }
        };
    }

    private static TriageResultDto ComputeTriage(IReadOnlyCollection<string> extractedPrimarySymptoms, IReadOnlyDictionary<string, object> answers)
    {
        var redFlags = new List<string>();
        decimal score = 20;

        var durationDays = NormalizeNumber(answers, "durationDays");
        if (durationDays > 3)
        {
            score += 10;
        }

        if (NormalizeBoolean(answers, "hasFever"))
        {
            score += 10;
        }

        var temperatureBand = NormalizeString(answers, "temperatureBand");
        if (string.Equals(temperatureBand, "39-plus", StringComparison.OrdinalIgnoreCase))
        {
            score += 20;
            redFlags.Add("High fever above 39 C");
        }

        if (NormalizeBoolean(answers, "breathingDifficulty"))
        {
            score += 30;
            redFlags.Add("Active breathing difficulty");
        }

        if (NormalizeBoolean(answers, "chestPain"))
        {
            score += 25;
            redFlags.Add("Current chest pain");
        }

        var dangerSymptoms = NormalizeStringList(answers, "dangerSymptoms");
        if (dangerSymptoms.Contains("confusion"))
        {
            score += 25;
            redFlags.Add("Confusion");
        }

        if (dangerSymptoms.Contains("cannot-drink"))
        {
            score += 20;
            redFlags.Add("Unable to keep fluids down");
        }

        if (dangerSymptoms.Contains("fainting"))
        {
            score += 25;
            redFlags.Add("Fainting episodes");
        }

        if (NormalizeBoolean(answers, "chronicCondition"))
        {
            score += 10;
        }

        var urgencyLevel = "Routine";
        if (redFlags.Count > 0 || score >= 75)
        {
            urgencyLevel = "Urgent";
        }
        else if (score >= 45)
        {
            urgencyLevel = "Priority";
        }

        var symptomText = extractedPrimarySymptoms.Count > 0 ? string.Join(", ", extractedPrimarySymptoms) : "reported symptoms";
        var explanation = urgencyLevel switch
        {
            "Urgent" => $"Urgent triage because {string.Join("; ", redFlags)} with {symptomText}.",
            "Priority" => $"Priority triage based on symptom severity profile for {symptomText}.",
            _ => $"Routine triage generated from {symptomText} with no immediate danger signs detected."
        };

        return new TriageResultDto
        {
            UrgencyLevel = urgencyLevel,
            PriorityScore = Math.Min(score, 100),
            Explanation = explanation,
            RedFlags = redFlags
        };
    }

    private static string BuildQueueStatus(string urgencyLevel)
    {
        if (string.Equals(urgencyLevel, "Urgent", StringComparison.Ordinal))
        {
            return "You have been flagged for immediate clinical attention. Queue position will be assigned shortly.";
        }

        if (string.Equals(urgencyLevel, "Priority", StringComparison.Ordinal))
        {
            return "You have been marked as priority. Queue position is being prepared.";
        }

        return "You have been checked in. Queue position will appear once assignment is completed.";
    }

    private static decimal NormalizeNumber(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (!answers.TryGetValue(key, out var rawValue) || rawValue == null)
        {
            return 0;
        }

        if (rawValue is decimal decimalValue)
        {
            return decimalValue;
        }

        if (rawValue is double doubleValue)
        {
            return Convert.ToDecimal(doubleValue);
        }

        if (rawValue is int intValue)
        {
            return intValue;
        }

        if (rawValue is long longValue)
        {
            return longValue;
        }

        if (rawValue is JsonElement jsonElement)
        {
            if (jsonElement.ValueKind == JsonValueKind.Number && jsonElement.TryGetDecimal(out var parsedDecimal))
            {
                return parsedDecimal;
            }

            if (jsonElement.ValueKind == JsonValueKind.String && decimal.TryParse(jsonElement.GetString(), out var parsedFromString))
            {
                return parsedFromString;
            }
        }

        if (decimal.TryParse(rawValue.ToString(), out var fallbackParsed))
        {
            return fallbackParsed;
        }

        return 0;
    }

    private static bool NormalizeBoolean(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (!answers.TryGetValue(key, out var rawValue) || rawValue == null)
        {
            return false;
        }

        if (rawValue is bool boolValue)
        {
            return boolValue;
        }

        if (rawValue is JsonElement jsonElement)
        {
            if (jsonElement.ValueKind == JsonValueKind.True)
            {
                return true;
            }

            if (jsonElement.ValueKind == JsonValueKind.False)
            {
                return false;
            }

            if (jsonElement.ValueKind == JsonValueKind.String)
            {
                var asString = jsonElement.GetString();
                return string.Equals(asString, "true", StringComparison.OrdinalIgnoreCase);
            }
        }

        return string.Equals(rawValue.ToString(), "true", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeString(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (!answers.TryGetValue(key, out var rawValue) || rawValue == null)
        {
            return string.Empty;
        }

        if (rawValue is JsonElement jsonElement)
        {
            return jsonElement.ValueKind == JsonValueKind.String ? jsonElement.GetString() : jsonElement.ToString();
        }

        return rawValue.ToString();
    }

    private static HashSet<string> NormalizeStringList(IReadOnlyDictionary<string, object> answers, string key)
    {
        var values = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!answers.TryGetValue(key, out var rawValue) || rawValue == null)
        {
            return values;
        }

        if (rawValue is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in jsonElement.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(item.GetString()))
                {
                    values.Add(item.GetString().Trim());
                }
            }

            return values;
        }

        if (rawValue is IEnumerable<object> objectEnumerable)
        {
            foreach (var item in objectEnumerable)
            {
                if (item != null && !string.IsNullOrWhiteSpace(item.ToString()))
                {
                    values.Add(item.ToString().Trim());
                }
            }

            return values;
        }

        var singleValue = rawValue.ToString();
        if (!string.IsNullOrWhiteSpace(singleValue))
        {
            values.Add(singleValue.Trim());
        }

        return values;
    }
}
