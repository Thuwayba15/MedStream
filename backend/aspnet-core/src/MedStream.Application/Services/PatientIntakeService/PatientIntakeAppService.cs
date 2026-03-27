using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
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
    private readonly IPathwayExecutionEngine _pathwayExecutionEngine;

    public PatientIntakeAppService(
        IRepository<Visit, long> visitRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<Facility, int> facilityRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IConfiguration configuration,
        IPathwayExecutionEngine pathwayExecutionEngine)
    {
        _visitRepository = visitRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _facilityRepository = facilityRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _configuration = configuration;
        _pathwayExecutionEngine = pathwayExecutionEngine;
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
        var execution = _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = input.PathwayKey,
            StageId = string.IsNullOrWhiteSpace(input.StageId) ? "patient_intake" : input.StageId.Trim(),
            Audience = string.IsNullOrWhiteSpace(input.Audience) ? "patient" : input.Audience.Trim(),
            PrimarySymptoms = string.IsNullOrWhiteSpace(input.PrimarySymptom)
                ? Array.Empty<string>()
                : new[] { input.PrimarySymptom.Trim() },
            Answers = input.Answers ?? new Dictionary<string, object>(),
            Observations = input.Observations ?? new Dictionary<string, object>()
        });

        var questionSet = execution.NextQuestions
            .Select(MapPathwayInputToQuestion)
            .ToList();

        return Task.FromResult(new GetIntakeQuestionsOutput
        {
            QuestionSet = questionSet,
            RuleTrace = MapRuleTrace(execution.RuleTrace)
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
        var pathwayExecution = _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = visit.PathwayKey,
            StageId = "patient_intake",
            Audience = "clinician",
            PrimarySymptoms = input.ExtractedPrimarySymptoms ?? new List<string>(),
            Answers = input.Answers ?? new Dictionary<string, object>(),
            Observations = input.Observations ?? new Dictionary<string, object>()
        });

        var triage = new TriageResultDto
        {
            UrgencyLevel = pathwayExecution.TriageIndicators.TryGetValue("urgencyLevel", out var urgency)
                ? urgency
                : "Routine",
            PriorityScore = pathwayExecution.Score,
            Explanation = pathwayExecution.TriageIndicators.TryGetValue("explanation", out var explanation)
                ? explanation
                : "Triage assessment completed.",
            RedFlags = pathwayExecution.TriggeredRedFlags
        };

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
            },
            Execution = new PathwayExecutionSummaryDto
            {
                TriggeredRedFlags = pathwayExecution.TriggeredRedFlags,
                TriageIndicators = pathwayExecution.TriageIndicators,
                TriggeredOutcomeIds = pathwayExecution.TriggeredOutcomeIds,
                TriggeredRecommendationIds = pathwayExecution.TriggeredRecommendationIds,
                TriggeredLinks = pathwayExecution.TriggeredLinks.Select(item => new PathwayTriggeredLinkDto
                {
                    Id = item.Id,
                    Label = item.Label,
                    TargetPathwayId = item.TargetPathwayId,
                    SourcePage = item.SourcePage
                }).ToList(),
                RuleTrace = MapRuleTrace(pathwayExecution.RuleTrace)
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

    private static IntakeQuestionDto MapPathwayInputToQuestion(PathwayInputJson input)
    {
        return new IntakeQuestionDto
        {
            QuestionKey = input.Id,
            QuestionText = input.Label,
            InputType = MapInputType(input.Type),
            DisplayOrder = input.DisplayOrder ?? int.MaxValue,
            IsRequired = input.Required,
            ShowWhenExpression = input.ShowWhenExpression,
            AnswerOptions = input.Options.Select(option => new IntakeQuestionOptionDto
            {
                Value = option.Value,
                Label = option.Label
            }).ToList()
        };
    }

    private static List<PathwayRuleTraceDto> MapRuleTrace(IEnumerable<PathwayRuleTraceItem> ruleTrace)
    {
        return ruleTrace.Select(item => new PathwayRuleTraceDto
        {
            RuleId = item.RuleId,
            Label = item.Label,
            Triggered = item.Triggered,
            EffectsSummary = item.EffectsSummary
        }).ToList();
    }

    private static string MapInputType(string type)
    {
        return type?.ToLowerInvariant() switch
        {
            "boolean" => "Boolean",
            "single_select" => "SingleSelect",
            "multiselect" => "MultiSelect",
            "multi_select" => "MultiSelect",
            "number" => "Number",
            "text" => "Text",
            _ => "Text"
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
}
