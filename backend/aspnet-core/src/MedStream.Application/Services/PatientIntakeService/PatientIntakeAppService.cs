#nullable enable
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using MedStream.QueueOperations;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientIntake;

/// <summary>
/// Application service implementing patient-side intake orchestration.
/// </summary>
[AbpAuthorize]
public partial class PatientIntakeAppService : MedStreamAppServiceBase, IPatientIntakeAppService
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
    public async Task<PatientCheckInOutput> CheckIn(PatientCheckInInput input)
    {
        if (input == null || input.SelectedFacilityId <= 0)
        {
            throw new UserFriendlyException("Select your hospital before continuing.");
        }

        var user = await EnsureCurrentPatientUserAsync();
        var tenantId = AbpSession.TenantId ?? 1;

        var facility = await _facilityRepository.FirstOrDefaultAsync(item =>
            item.Id == input.SelectedFacilityId &&
            item.TenantId == tenantId &&
            item.IsActive);
        if (facility == null)
        {
            throw new UserFriendlyException("The selected hospital is no longer available.");
        }

        var visit = new Visit
        {
            TenantId = tenantId,
            PatientUserId = user.Id,
            FacilityId = facility.Id,
            VisitDate = DateTime.UtcNow,
            Status = PatientIntakeConstants.VisitStatusIntakeInProgress,
            PathwayKey = PatientIntakeConstants.UnassignedPathwayKey
        };

        await _visitRepository.InsertAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new PatientCheckInOutput
        {
            VisitId = visit.Id,
            FacilityId = facility.Id,
            FacilityName = facility.Name,
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

        var extraction = await _pathwayExtractionService.ExtractAsync(
            input.FreeText ?? string.Empty,
            input.SelectedSymptoms ?? new List<string>());

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
}
