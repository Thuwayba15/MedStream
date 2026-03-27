using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientIntake;

/// <summary>
/// Application service implementing the patient intake workflow (check-in, extraction, dynamic questions, and triage).
/// </summary>
[AbpAuthorize]
public class PatientIntakeAppService : MedStreamAppServiceBase, IPatientIntakeAppService
{
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<Facility, int> _facilityRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly IPathwayDefinitionProvider _pathwayDefinitionProvider;
    private readonly IPathwayExecutionEngine _pathwayExecutionEngine;
    private readonly IPathwayExtractionService _pathwayExtractionService;

    public PatientIntakeAppService(
        IRepository<Visit, long> visitRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<Facility, int> facilityRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IPathwayDefinitionProvider pathwayDefinitionProvider,
        IPathwayExecutionEngine pathwayExecutionEngine,
        IPathwayExtractionService pathwayExtractionService)
    {
        _visitRepository = visitRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _facilityRepository = facilityRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _pathwayDefinitionProvider = pathwayDefinitionProvider;
        _pathwayExecutionEngine = pathwayExecutionEngine;
        _pathwayExtractionService = pathwayExtractionService;
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
            PathwayKey = PatientIntakeConstants.UnassignedPathwayKey
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

        var extraction = await _pathwayExtractionService.ExtractAsync(input.FreeText ?? string.Empty, input.SelectedSymptoms ?? new List<string>());

        intake.ExtractedPrimarySymptoms = SerializeStringList(extraction.ExtractedPrimarySymptoms);
        intake.ExtractionSource = extraction.ExtractionSource;
        intake.MappedInputValues = JsonConvert.SerializeObject(extraction.MappedInputValues ?? new Dictionary<string, object>());
        intake.SubmittedAt = DateTime.UtcNow;
        visit.PathwayKey = string.IsNullOrWhiteSpace(extraction.SelectedPathwayId)
            ? PatientIntakeConstants.DefaultPathwayKey
            : extraction.SelectedPathwayId;

        await _symptomIntakeRepository.UpdateAsync(intake);
        await _visitRepository.UpdateAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new ExtractSymptomsOutput
        {
            ExtractedPrimarySymptoms = extraction.ExtractedPrimarySymptoms,
            ExtractionSource = extraction.ExtractionSource,
            LikelyPathwayIds = extraction.LikelyPathwayIds,
            SelectedPathwayKey = visit.PathwayKey,
            ConfidenceBand = extraction.ConfidenceBand,
            ShouldAskDisambiguation = extraction.ShouldAskDisambiguation,
            DisambiguationPrompt = extraction.DisambiguationPrompt,
            Candidates = extraction.Candidates.Select(MapClassificationCandidate).ToList(),
            MappedInputValues = extraction.MappedInputValues
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
        var intake = await GetOrCreateIntakeAsync(visit.Id, visit.TenantId);
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
        intake.FollowUpAnswersJson = JsonConvert.SerializeObject(input.Answers ?? new Dictionary<string, object>());
        intake.SubjectiveSummary = BuildSubjectiveSummary(visit.PathwayKey, intake, input.Answers ?? new Dictionary<string, object>());
        intake.SubmittedAt = assessedAt;

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

        await _symptomIntakeRepository.UpdateAsync(intake);
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

    private static PathwayClassificationCandidateDto MapClassificationCandidate(PathwayClassificationCandidate candidate)
    {
        return new PathwayClassificationCandidateDto
        {
            PathwayId = candidate.PathwayId,
            TotalScore = candidate.TotalScore,
            ConfidenceBand = candidate.ConfidenceBand.ToString(),
            MatchedSignals = candidate.MatchedSignals.Select(item => new PathwayClassificationSignalDto
            {
                SignalType = item.SignalType,
                MatchedTerm = item.MatchedTerm,
                Weight = item.Weight
            }).ToList()
        };
    }

    private string BuildSubjectiveSummary(string pathwayKey, SymptomIntake intake, IReadOnlyDictionary<string, object> answers)
    {
        var safePathwayKey = string.IsNullOrWhiteSpace(pathwayKey) || string.Equals(pathwayKey, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase)
            ? PatientIntakeConstants.GeneralFallbackPathwayKey
            : pathwayKey;
        var selectedSymptoms = DeserializeList(intake.SelectedSymptoms);
        var extractedSymptoms = DeserializeList(intake.ExtractedPrimarySymptoms);
        var summaryParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(intake.FreeTextComplaint))
        {
            summaryParts.Add($"Chief complaint: {intake.FreeTextComplaint.Trim()}");
        }

        if (selectedSymptoms.Count > 0)
        {
            summaryParts.Add($"Selected symptoms: {string.Join(", ", selectedSymptoms)}");
        }

        if (extractedSymptoms.Count > 0)
        {
            summaryParts.Add($"Extracted primary symptoms: {string.Join(", ", extractedSymptoms)}");
        }

        if (answers.Count == 0)
        {
            return string.Join("\n", summaryParts);
        }

        PathwayDefinitionJson pathwayDefinition;
        try
        {
            pathwayDefinition = _pathwayDefinitionProvider.GetById(safePathwayKey);
        }
        catch
        {
            pathwayDefinition = _pathwayDefinitionProvider.GetById(PatientIntakeConstants.GeneralFallbackPathwayKey);
        }

        var inputLookup = pathwayDefinition.Inputs
            .Where(item => string.Equals(item.Stage, "patient_intake", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(item => item.Id, item => item.Label, StringComparer.OrdinalIgnoreCase);

        var answeredDetails = answers
            .Where(item => item.Value != null)
            .Select(item =>
            {
                var label = inputLookup.TryGetValue(item.Key, out var mappedLabel) ? mappedLabel : item.Key;
                return $"{label}: {FormatAnswer(item.Value)}";
            })
            .ToList();

        if (answeredDetails.Count > 0)
        {
            summaryParts.Add($"Follow-up answers: {string.Join("; ", answeredDetails)}");
        }

        return string.Join("\n", summaryParts);
    }

    private static List<string> DeserializeList(string serializedList)
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

    private static string FormatAnswer(object value)
    {
        if (value is IEnumerable<object> objectList && value is not string)
        {
            return string.Join(", ", objectList.Select(item => Convert.ToString(item)?.Trim()).Where(item => !string.IsNullOrWhiteSpace(item)));
        }

        if (value is System.Collections.IEnumerable enumerable && value is not string)
        {
            var values = new List<string>();
            foreach (var item in enumerable)
            {
                var text = Convert.ToString(item)?.Trim();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    values.Add(text);
                }
            }

            return string.Join(", ", values);
        }

        return Convert.ToString(value)?.Trim() ?? string.Empty;
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
