using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using MedStream.QueueOperations;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
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
    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<QueueEvent, long> _queueEventRepository;
    private readonly IRepository<Facility, int> _facilityRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly IPathwayDefinitionProvider _pathwayDefinitionProvider;
    private readonly IPathwayExecutionEngine _pathwayExecutionEngine;
    private readonly IPathwayExtractionService _pathwayExtractionService;
    private readonly IApcFallbackQuestionService _apcFallbackQuestionService;
    private readonly IQueueRealtimeNotifier _queueRealtimeNotifier;

    public PatientIntakeAppService(
        IRepository<Visit, long> visitRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<QueueEvent, long> queueEventRepository,
        IRepository<Facility, int> facilityRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IPathwayDefinitionProvider pathwayDefinitionProvider,
        IPathwayExecutionEngine pathwayExecutionEngine,
        IPathwayExtractionService pathwayExtractionService,
        IApcFallbackQuestionService apcFallbackQuestionService,
        IQueueRealtimeNotifier queueRealtimeNotifier)
    {
        _visitRepository = visitRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _queueTicketRepository = queueTicketRepository;
        _queueEventRepository = queueEventRepository;
        _facilityRepository = facilityRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _pathwayDefinitionProvider = pathwayDefinitionProvider;
        _pathwayExecutionEngine = pathwayExecutionEngine;
        _pathwayExtractionService = pathwayExtractionService;
        _apcFallbackQuestionService = apcFallbackQuestionService;
        _queueRealtimeNotifier = queueRealtimeNotifier;
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

        if (!string.IsNullOrWhiteSpace(input.FreeText))
        {
            intake.FreeTextComplaint = input.FreeText.Trim();
        }

        if (input.SelectedSymptoms != null && input.SelectedSymptoms.Count > 0)
        {
            intake.SelectedSymptoms = SerializeStringList(input.SelectedSymptoms);
        }

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
            IntakeMode = extraction.IntakeMode,
            ConfidenceBand = extraction.ConfidenceBand,
            ShouldAskDisambiguation = extraction.ShouldAskDisambiguation,
            DisambiguationPrompt = extraction.DisambiguationPrompt,
            FallbackSectionIds = extraction.FallbackSectionIds,
            FallbackSummaryIds = extraction.FallbackSummaryIds,
            Candidates = extraction.Candidates.Select(MapClassificationCandidate).ToList(),
            MappedInputValues = extraction.MappedInputValues
        };
    }

    /// <inheritdoc />
    [HttpPost]
    public async Task<GetIntakeQuestionsOutput> GetQuestions(GetIntakeQuestionsInput input)
    {
        Logger.Info($"[Intake][Questions] Request. visitId={input.VisitId}, pathway={input.PathwayKey}, useApcFallback={input.UseApcFallback}, fallbackSummaryCount={input.FallbackSummaryIds?.Count ?? 0}");
        if (input.UseApcFallback)
        {
            var fallbackQuestions = await _apcFallbackQuestionService.GenerateQuestionsAsync(
                input.FreeText ?? string.Empty,
                input.SelectedSymptoms ?? new List<string>(),
                input.ExtractedPrimarySymptoms ?? new List<string>(),
                input.FallbackSummaryIds ?? new List<string>());
            Logger.Info($"[Intake][Questions] APC fallback questions generated. count={fallbackQuestions.Count}");

            return new GetIntakeQuestionsOutput
            {
                QuestionSet = fallbackQuestions,
                RuleTrace = new List<PathwayRuleTraceDto>()
            };
        }

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
        Logger.Info($"[Intake][Questions] Approved JSON pathway questions generated. count={questionSet.Count}, stage={input.StageId ?? "patient_intake"}");

        return new GetIntakeQuestionsOutput
        {
            QuestionSet = questionSet,
            RuleTrace = MapRuleTrace(execution.RuleTrace)
        };
    }

    /// <inheritdoc />
    [HttpPost]
    public Task<GetIntakeQuestionsOutput> LoadQuestions(GetIntakeQuestionsInput input)
    {
        return GetQuestions(input);
    }

    /// <inheritdoc />
    public async Task<UrgentCheckOutput> UrgentCheck(UrgentCheckInput input)
    {
        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var urgentAnswers = input.Answers ?? new Dictionary<string, object>();
        var safePathwayKey = string.IsNullOrWhiteSpace(input.PathwayKey)
            ? visit.PathwayKey
            : input.PathwayKey.Trim();
        if (string.IsNullOrWhiteSpace(safePathwayKey) || string.Equals(safePathwayKey, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            safePathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey;
        }

        var execution = _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = safePathwayKey,
            StageId = "urgent_check",
            Audience = "patient",
            PrimarySymptoms = input.ExtractedPrimarySymptoms ?? new List<string>(),
            Answers = urgentAnswers,
            Observations = new Dictionary<string, object>()
        });

        var globalUrgentReasons = EvaluateGlobalUrgency(input.FreeText, urgentAnswers);
        var pathwayUrgentReasons = execution.TriggeredRedFlags
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var urgentReasons = globalUrgentReasons
            .Concat(pathwayUrgentReasons)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var isUrgent = urgentReasons.Count > 0 || string.Equals(execution.TriageIndicators.GetValueOrDefault("urgencyLevel"), "Urgent", StringComparison.OrdinalIgnoreCase);
        var intakeMode = string.IsNullOrWhiteSpace(input.IntakeMode) ? PatientIntakeConstants.IntakeModeApprovedJson : input.IntakeMode.Trim();
        var fallbackSummaryIds = input.FallbackSummaryIds ?? new List<string>();

        var questionSet = BuildUrgentCheckQuestionSet();
        Logger.Info($"[Intake][UrgentCheck] pathway={safePathwayKey}, intakeMode={intakeMode}, urgent={isUrgent}, questionCount={questionSet.Count}, reasons={string.Join(", ", urgentReasons)}");
        return new UrgentCheckOutput
        {
            QuestionSet = questionSet,
            IsUrgent = isUrgent,
            ShouldFastTrack = isUrgent,
            TriggerReasons = urgentReasons,
            IntakeMode = intakeMode,
            FallbackSummaryIds = fallbackSummaryIds,
            Message = isUrgent
                ? "Urgent signs detected. We are fast-tracking your intake."
                : "Urgent check completed. Continue to symptom intake."
        };
    }

    /// <inheritdoc />
    public async Task<AssessTriageOutput> AssessTriage(AssessTriageInput input)
    {
        if (input.ExtractedPrimarySymptoms == null || input.ExtractedPrimarySymptoms.Count == 0)
        {
            if (!HasGlobalUrgentPositiveAnswers(input.Answers))
            {
                throw new UserFriendlyException("At least one extracted symptom is required before triage.");
            }
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var intake = await GetOrCreateIntakeAsync(visit.Id, visit.TenantId);
        var safePathwayKey = string.IsNullOrWhiteSpace(visit.PathwayKey) || string.Equals(visit.PathwayKey, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase)
            ? PatientIntakeConstants.GeneralFallbackPathwayKey
            : visit.PathwayKey;
        var pathwayExecution = _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = safePathwayKey,
            StageId = "patient_intake",
            Audience = "patient",
            PrimarySymptoms = input.ExtractedPrimarySymptoms ?? new List<string>(),
            Answers = input.Answers ?? new Dictionary<string, object>(),
            Observations = input.Observations ?? new Dictionary<string, object>()
        });
        var hasGlobalUrgent = HasGlobalUrgentPositiveAnswers(input.Answers);
        var resolvedRedFlags = pathwayExecution.TriggeredRedFlags ?? new List<string>();
        if (hasGlobalUrgent && !resolvedRedFlags.Contains("global_urgent_check_positive", StringComparer.OrdinalIgnoreCase))
        {
            resolvedRedFlags = resolvedRedFlags.Concat(new[] { "global_urgent_check_positive" }).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }

        var resolvedUrgency = pathwayExecution.TriageIndicators.TryGetValue("urgencyLevel", out var urgency)
            ? urgency
            : "Routine";
        var resolvedExplanation = pathwayExecution.TriageIndicators.TryGetValue("explanation", out var explanation)
            ? explanation
            : "Triage assessment completed.";
        var resolvedPriorityScore = pathwayExecution.Score;

        if (hasGlobalUrgent)
        {
            resolvedUrgency = "Urgent";
            resolvedPriorityScore = Math.Max(resolvedPriorityScore, 95m);
            resolvedExplanation = "Urgent triage because one or more emergency safety checks were positive.";
        }

        var triage = new TriageResultDto
        {
            UrgencyLevel = resolvedUrgency,
            Explanation = resolvedExplanation,
            RedFlags = resolvedRedFlags
        };

        var assessedAt = DateTime.UtcNow;
        intake.FollowUpAnswersJson = JsonConvert.SerializeObject(input.Answers ?? new Dictionary<string, object>());
        intake.SubjectiveSummary = BuildSubjectiveSummary(visit.PathwayKey, intake, input.Answers ?? new Dictionary<string, object>());
        intake.SubmittedAt = assessedAt;

        var triageEntity = new TriageAssessment
        {
            TenantId = visit.TenantId,
            VisitId = visit.Id,
            UrgencyLevel = triage.UrgencyLevel,
            PriorityScore = resolvedPriorityScore,
            Explanation = triage.Explanation,
            RedFlagsDetected = SerializeStringList(triage.RedFlags),
            PositionPending = false,
            QueueMessage = string.Empty,
            LastQueueUpdatedAt = assessedAt,
            AssessedAt = assessedAt
        };

        await _symptomIntakeRepository.UpdateAsync(intake);
        triageEntity = await _triageAssessmentRepository.InsertAsync(triageEntity);
        await CurrentUnitOfWork.SaveChangesAsync();

        var queueTicket = await GetOrCreateActiveQueueTicketAsync(visit, triageEntity, assessedAt);
        var queueMessage = BuildQueueStatus(queueTicket, triage.UrgencyLevel);
        triageEntity.QueueMessage = queueMessage;
        triageEntity.LastQueueUpdatedAt = queueTicket.LastStatusChangedAt;
        triageEntity.PositionPending = false;

        visit.Status = PatientIntakeConstants.VisitStatusQueued;
        await _visitRepository.UpdateAsync(visit);
        await _triageAssessmentRepository.UpdateAsync(triageEntity);
        await CurrentUnitOfWork.SaveChangesAsync();
        return BuildPatientQueueStatusOutput(triageEntity, queueTicket, pathwayExecution);
    }

    /// <inheritdoc />
    public async Task<AssessTriageOutput> GetCurrentQueueStatus(GetCurrentQueueStatusInput input)
    {
        if (input.VisitId <= 0)
        {
            throw new UserFriendlyException("Visit id is required.");
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var triageAssessment = await _triageAssessmentRepository.FirstOrDefaultAsync(item =>
            item.TenantId == visit.TenantId &&
            item.VisitId == visit.Id &&
            !item.IsDeleted);
        if (triageAssessment == null)
        {
            throw new UserFriendlyException("Triage assessment was not found for this visit.");
        }

        var queueTicket = await _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == visit.TenantId &&
                           item.VisitId == visit.Id &&
                           !item.IsDeleted)
            .OrderByDescending(item => item.LastStatusChangedAt)
            .FirstOrDefaultAsync();
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found for this visit.");
        }

        return BuildPatientQueueStatusOutput(triageAssessment, queueTicket);
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

    private async Task<QueueTicket> GetOrCreateActiveQueueTicketAsync(Visit visit, TriageAssessment triageAssessment, DateTime assessedAt)
    {
        var activeTicket = await _queueTicketRepository.FirstOrDefaultAsync(item =>
            item.TenantId == visit.TenantId &&
            item.VisitId == visit.Id &&
            item.IsActive &&
            !item.IsDeleted);
        if (activeTicket != null)
        {
            return activeTicket;
        }

        var facilityId = await ResolveFacilityIdAsync(visit);
        await SupersedePreviousActiveQueueTicketsAsync(visit, facilityId, assessedAt);
        var queueDate = assessedAt.Date;
        var nextQueueNumber = await GetNextQueueNumberAsync(visit.TenantId, facilityId, queueDate);
        var queueTicket = new QueueTicket
        {
            TenantId = visit.TenantId,
            FacilityId = facilityId,
            VisitId = visit.Id,
            TriageAssessmentId = triageAssessment.Id,
            QueueDate = queueDate,
            QueueNumber = nextQueueNumber,
            QueueStatus = PatientIntakeConstants.QueueStatusWaiting,
            CurrentStage = "Waiting",
            IsActive = true,
            EnteredQueueAt = assessedAt,
            LastStatusChangedAt = assessedAt
        };

        queueTicket = await _queueTicketRepository.InsertAsync(queueTicket);
        await CurrentUnitOfWork.SaveChangesAsync();

        await _queueEventRepository.InsertAsync(new QueueEvent
        {
            TenantId = visit.TenantId,
            QueueTicketId = queueTicket.Id,
            EventType = PatientIntakeConstants.QueueEventEntered,
            OldStatus = null,
            NewStatus = queueTicket.QueueStatus,
            Notes = "Queue ticket created after triage completion.",
            EventAt = assessedAt
        });

        await CurrentUnitOfWork.SaveChangesAsync();
        if (_queueRealtimeNotifier != null)
        {
            await _queueRealtimeNotifier.NotifyFacilityQueueChangedAsync(queueTicket.FacilityId);
            await _queueRealtimeNotifier.NotifyPatientQueueChangedAsync(visit.PatientUserId, visit.Id, queueTicket.Id);
        }
        return queueTicket;
    }

    private async Task SupersedePreviousActiveQueueTicketsAsync(Visit visit, int facilityId, DateTime supersededAt)
    {
        var previousActiveTickets = await (
            from queueTicket in _queueTicketRepository.GetAll()
            join existingVisit in _visitRepository.GetAll() on queueTicket.VisitId equals existingVisit.Id
            where queueTicket.TenantId == visit.TenantId &&
                  queueTicket.FacilityId == facilityId &&
                  existingVisit.PatientUserId == visit.PatientUserId &&
                  queueTicket.VisitId != visit.Id &&
                  queueTicket.IsActive &&
                  !queueTicket.IsDeleted
            select new
            {
                QueueTicket = queueTicket,
                Visit = existingVisit
            }).ToListAsync();

        foreach (var previousTicketEntry in previousActiveTickets)
        {
            var previousStatus = previousTicketEntry.QueueTicket.QueueStatus;
            previousTicketEntry.QueueTicket.QueueStatus = PatientIntakeConstants.QueueStatusCancelled;
            previousTicketEntry.QueueTicket.CurrentStage = "Cancelled";
            previousTicketEntry.QueueTicket.IsActive = false;
            previousTicketEntry.QueueTicket.CancelledAt = supersededAt;
            previousTicketEntry.QueueTicket.LastStatusChangedAt = supersededAt;

            previousTicketEntry.Visit.Status = "Cancelled";

            await _queueTicketRepository.UpdateAsync(previousTicketEntry.QueueTicket);
            await _visitRepository.UpdateAsync(previousTicketEntry.Visit);

            await _queueEventRepository.InsertAsync(new QueueEvent
            {
                TenantId = visit.TenantId,
                QueueTicketId = previousTicketEntry.QueueTicket.Id,
                EventType = PatientIntakeConstants.QueueEventStatusChanged,
                OldStatus = previousStatus,
                NewStatus = PatientIntakeConstants.QueueStatusCancelled,
                Notes = $"Queue ticket superseded by new visit {visit.Id}.",
                EventAt = supersededAt
            });

            if (_queueRealtimeNotifier != null)
            {
                await _queueRealtimeNotifier.NotifyFacilityQueueChangedAsync(previousTicketEntry.QueueTicket.FacilityId);
                await _queueRealtimeNotifier.NotifyPatientQueueChangedAsync(previousTicketEntry.Visit.PatientUserId, previousTicketEntry.Visit.Id, previousTicketEntry.QueueTicket.Id);
            }
        }
    }

    private async Task<int> ResolveFacilityIdAsync(Visit visit)
    {
        if (visit.FacilityId.HasValue)
        {
            return visit.FacilityId.Value;
        }

        var fallbackFacility = await _facilityRepository.FirstOrDefaultAsync(item => item.TenantId == visit.TenantId && item.IsActive);
        if (fallbackFacility == null)
        {
            throw new UserFriendlyException("No active facility is available for queue assignment.");
        }

        visit.FacilityId = fallbackFacility.Id;
        await _visitRepository.UpdateAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();
        return fallbackFacility.Id;
    }

    private async Task<int> GetNextQueueNumberAsync(int tenantId, int facilityId, DateTime queueDate)
    {
        var queueDateStart = queueDate.Date;
        var queueDateEndExclusive = queueDateStart.AddDays(1);

        var currentMax = await _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == tenantId &&
                           item.FacilityId == facilityId &&
                           item.QueueDate >= queueDateStart &&
                           item.QueueDate < queueDateEndExclusive &&
                           !item.IsDeleted)
            .OrderByDescending(item => item.QueueNumber)
            .Select(item => item.QueueNumber)
            .FirstOrDefaultAsync();

        return currentMax + 1;
    }

    private AssessTriageOutput BuildPatientQueueStatusOutput(
        TriageAssessment triageAssessment,
        QueueTicket queueTicket,
        PathwayExecutionResult pathwayExecution = null)
    {
        return new AssessTriageOutput
        {
            Triage = new TriageResultDto
            {
                UrgencyLevel = triageAssessment.UrgencyLevel,
                Explanation = triageAssessment.Explanation,
                RedFlags = DeserializeList(triageAssessment.RedFlagsDetected)
            },
            Queue = new QueueStatusDto
            {
                QueueTicketId = queueTicket.Id,
                QueueNumber = queueTicket.QueueNumber,
                QueueStatus = queueTicket.QueueStatus,
                CurrentStage = queueTicket.CurrentStage,
                PositionPending = triageAssessment.PositionPending,
                Message = BuildQueueStatus(queueTicket, triageAssessment.UrgencyLevel),
                LastUpdatedAt = queueTicket.LastStatusChangedAt,
                EnteredQueueAt = queueTicket.EnteredQueueAt
            },
            Execution = new PathwayExecutionSummaryDto
            {
                TriggeredRedFlags = pathwayExecution?.TriggeredRedFlags ?? DeserializeList(triageAssessment.RedFlagsDetected),
                TriageIndicators = pathwayExecution?.TriageIndicators ?? new Dictionary<string, string>
                {
                    ["urgencyLevel"] = triageAssessment.UrgencyLevel,
                    ["explanation"] = triageAssessment.Explanation
                },
                TriggeredOutcomeIds = new List<string>(),
                TriggeredRecommendationIds = new List<string>(),
                TriggeredLinks = new List<PathwayTriggeredLinkDto>(),
                RuleTrace = new List<PathwayRuleTraceDto>()
            }
        };
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

        var keyDetails = answers
            .Where(item => ShouldIncludeAnswerInSummary(item.Value))
            .Select(item =>
            {
                var label = inputLookup.TryGetValue(item.Key, out var mappedLabel) ? mappedLabel : HumanizeAnswerKey(item.Key);
                return BuildReadableSummaryAnswer(label, item.Value);
            })
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();

        if (keyDetails.Count > 0)
        {
            summaryParts.Add($"Key details: {string.Join(" ", keyDetails)}");
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

    private static bool ShouldIncludeAnswerInSummary(object value)
    {
        if (value == null)
        {
            return false;
        }

        if (value is bool booleanValue)
        {
            return booleanValue;
        }

        if (value is string stringValue)
        {
            return !string.IsNullOrWhiteSpace(stringValue) &&
                   !string.Equals(stringValue.Trim(), "false", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(stringValue.Trim(), "no", StringComparison.OrdinalIgnoreCase);
        }

        if (value is System.Collections.IEnumerable enumerable && value is not string)
        {
            foreach (var item in enumerable)
            {
                if (!string.IsNullOrWhiteSpace(Convert.ToString(item)?.Trim()))
                {
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    private static string BuildReadableSummaryAnswer(string label, object value)
    {
        if (value is bool booleanValue)
        {
            return booleanValue ? $"{label}." : string.Empty;
        }

        var formattedValue = FormatAnswer(value);
        return string.IsNullOrWhiteSpace(formattedValue) ? string.Empty : $"{label}: {formattedValue}.";
    }

    private static string HumanizeAnswerKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return string.Empty;
        }

        return key switch
        {
            "urgentSevereBreathing" => "Severe difficulty breathing reported",
            "urgentSevereChestPain" => "Severe chest pain reported",
            "urgentUncontrolledBleeding" => "Uncontrolled bleeding reported",
            "urgentCollapse" => "Collapse or blackout reported",
            "urgentConfusion" => "Confusion or reduced responsiveness reported",
            "hasFever" => "Fever reported",
            "durationDays" => "Duration",
            "mainConcern" => "Main concern",
            _ => char.ToUpperInvariant(key[0]) + string.Concat(key.Skip(1)).Replace("_", " ")
        };
    }

    private static List<string> EvaluateGlobalUrgency(string freeText, IReadOnlyDictionary<string, object> answers)
    {
        var reasons = new List<string>();
        if (GetBooleanAnswer(answers, "urgentSevereBreathing") ||
            GetBooleanAnswer(answers, "urgentSevereChestPain") ||
            GetBooleanAnswer(answers, "urgentUncontrolledBleeding") ||
            GetBooleanAnswer(answers, "urgentConfusion") ||
            GetBooleanAnswer(answers, "urgentCollapse"))
        {
            reasons.Add("global_urgent_check_positive");
        }

        var normalized = (freeText ?? string.Empty).ToLowerInvariant();
        if (normalized.Contains("can't breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("cannot breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("struggling to breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("severe chest pain", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("bleeding heavily", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("passed out", StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add("urgent_keyword_detected");
        }

        return reasons;
    }

    private static List<IntakeQuestionDto> BuildUrgentCheckQuestionSet()
    {
        return new List<IntakeQuestionDto>
        {
            new()
            {
                QuestionKey = "urgentSevereBreathing",
                QuestionText = "Are you struggling to breathe right now?",
                InputType = "Boolean",
                DisplayOrder = 1,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "urgentSevereChestPain",
                QuestionText = "Do you have severe chest pain right now?",
                InputType = "Boolean",
                DisplayOrder = 2,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "urgentUncontrolledBleeding",
                QuestionText = "Do you have heavy bleeding that is not stopping?",
                InputType = "Boolean",
                DisplayOrder = 3,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "urgentCollapse",
                QuestionText = "Did you faint, collapse, or lose consciousness today?",
                InputType = "Boolean",
                DisplayOrder = 4,
                IsRequired = true
            },
            new()
            {
                QuestionKey = "urgentConfusion",
                QuestionText = "Are you currently confused, unusually sleepy, or difficult to wake?",
                InputType = "Boolean",
                DisplayOrder = 5,
                IsRequired = true
            }
        };
    }

    private static bool HasGlobalUrgentPositiveAnswers(IReadOnlyDictionary<string, object> answers)
    {
        return GetBooleanAnswer(answers ?? new Dictionary<string, object>(), "urgentSevereBreathing") ||
               GetBooleanAnswer(answers ?? new Dictionary<string, object>(), "urgentSevereChestPain") ||
               GetBooleanAnswer(answers ?? new Dictionary<string, object>(), "urgentUncontrolledBleeding") ||
               GetBooleanAnswer(answers ?? new Dictionary<string, object>(), "urgentCollapse") ||
               GetBooleanAnswer(answers ?? new Dictionary<string, object>(), "urgentConfusion");
    }

    private static bool GetBooleanAnswer(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (!answers.TryGetValue(key, out var value) || value == null)
        {
            return false;
        }

        if (value is bool boolValue)
        {
            return boolValue;
        }

        if (value is string stringValue)
        {
            return string.Equals(stringValue.Trim(), "true", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(stringValue.Trim(), "yes", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static string BuildQueueStatus(QueueTicket queueTicket, string urgencyLevel)
    {
        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCalled, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: clinician is ready to see you.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: consultation is in progress.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: consultation completed.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCancelled, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: queue entry cancelled.";
        }

        if (string.Equals(urgencyLevel, "Urgent", StringComparison.Ordinal))
        {
            return $"Queue #{queueTicket.QueueNumber}: urgent case flagged for immediate clinical attention.";
        }

        if (string.Equals(urgencyLevel, "Priority", StringComparison.Ordinal))
        {
            return $"Queue #{queueTicket.QueueNumber}: marked as priority and currently waiting.";
        }

        return $"Queue #{queueTicket.QueueNumber}: checked in and waiting for clinician call.";
    }
}
