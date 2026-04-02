#nullable enable
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientIntake;
using MedStream.QueueOperations.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Application service for clinician queue listing and review orchestration.
/// </summary>
[AbpAuthorize]
public partial class QueueOperationsAppService : MedStreamAppServiceBase, IQueueOperationsAppService
{
    private static readonly IReadOnlyDictionary<string, HashSet<string>> AllowedTransitions =
        new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [PatientIntakeConstants.QueueStatusWaiting] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusCalled,
                PatientIntakeConstants.QueueStatusInConsultation,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusCalled] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusWaiting,
                PatientIntakeConstants.QueueStatusInConsultation,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusInConsultation] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusCompleted,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusCompleted] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [PatientIntakeConstants.QueueStatusCancelled] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<QueueEvent, long> _queueEventRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<EncounterNote, long> _encounterNoteRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private readonly IQueueRealtimeNotifier _queueRealtimeNotifier;

    public QueueOperationsAppService(
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<QueueEvent, long> queueEventRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<Visit, long> visitRepository,
        IRepository<EncounterNote, long> encounterNoteRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IQueueRealtimeNotifier queueRealtimeNotifier,
        Microsoft.Extensions.Configuration.IConfiguration configuration = null)
    {
        _queueTicketRepository = queueTicketRepository;
        _queueEventRepository = queueEventRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _visitRepository = visitRepository;
        _encounterNoteRepository = encounterNoteRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _configuration = configuration;
        _queueRealtimeNotifier = queueRealtimeNotifier;
    }

    /// <inheritdoc />
    public async Task<ClinicianQueueDashboardDto> GetClinicianQueue(GetClinicianQueueInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before viewing queue.");
        var normalizedQueueStatuses = NormalizeFilterValues(input.QueueStatuses);
        var normalizedUrgencyLevels = NormalizeFilterValues(input.UrgencyLevels);
        var normalizedSearch = (input.SearchText ?? string.Empty).Trim().ToLowerInvariant();

        var queueQuery =
            from queueTicket in _queueTicketRepository.GetAll()
            join triageAssessment in _triageAssessmentRepository.GetAll() on queueTicket.TriageAssessmentId equals triageAssessment.Id
            join visit in _visitRepository.GetAll() on queueTicket.VisitId equals visit.Id
            join patientUser in _userRepository.GetAll() on visit.PatientUserId equals patientUser.Id
            where queueTicket.TenantId == tenantId &&
                  queueTicket.FacilityId == facilityId &&
                  queueTicket.IsActive &&
                  !queueTicket.IsDeleted
            select new
            {
                queueTicket.Id,
                queueTicket.VisitId,
                visit.PatientUserId,
                queueTicket.QueueNumber,
                queueTicket.QueueStatus,
                queueTicket.CurrentStage,
                queueTicket.EnteredQueueAt,
                queueTicket.IsActive,
                triageAssessment.UrgencyLevel,
                triageAssessment.PriorityScore,
                PatientName = string.Concat(patientUser.Name, " ", patientUser.Surname),
                UrgencyRank = triageAssessment.UrgencyLevel == "Urgent"
                    ? 0
                    : triageAssessment.UrgencyLevel == "Priority"
                        ? 1
                        : triageAssessment.UrgencyLevel == "Routine"
                            ? 2
                            : 3
            };

        if (normalizedQueueStatuses.Count > 0)
        {
            queueQuery = queueQuery.Where(item => normalizedQueueStatuses.Contains(item.QueueStatus.ToLower()));
        }

        if (normalizedUrgencyLevels.Count > 0)
        {
            queueQuery = queueQuery.Where(item => normalizedUrgencyLevels.Contains(item.UrgencyLevel.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            queueQuery = queueQuery.Where(item =>
                item.PatientName.ToLower().Contains(normalizedSearch) ||
                item.QueueNumber.ToString().Contains(normalizedSearch));
        }

        var totalCount = await queueQuery.CountAsync();
        var effectiveMaxResultCount = input.MaxResultCount <= 0 ? 50 : Math.Min(input.MaxResultCount, 200);
        var queueRows = await queueQuery
            .OrderBy(item => item.UrgencyRank)
            .ThenByDescending(item => item.PriorityScore)
            .ThenBy(item => item.EnteredQueueAt)
            .Skip(input.SkipCount)
            .Take(effectiveMaxResultCount)
            .ToListAsync();

        var nowUtc = DateTime.UtcNow;
        var outputRows = queueRows.Select(item => new ClinicianQueueItemDto
        {
            QueueTicketId = item.Id,
            VisitId = item.VisitId,
            PatientUserId = item.PatientUserId,
            PatientName = item.PatientName.Trim(),
            QueueNumber = item.QueueNumber,
            QueueStatus = item.QueueStatus,
            CurrentStage = item.CurrentStage,
            UrgencyLevel = item.UrgencyLevel,
            PriorityScore = item.PriorityScore,
            EnteredQueueAt = item.EnteredQueueAt,
            WaitingMinutes = (int)Math.Max(0, (nowUtc - item.EnteredQueueAt).TotalMinutes),
            IsActive = item.IsActive
        }).ToList();

        var startOfTodayUtc = nowUtc.Date;
        var summaryRows = await (
            from queueTicket in _queueTicketRepository.GetAll()
            join triageAssessment in _triageAssessmentRepository.GetAll() on queueTicket.TriageAssessmentId equals triageAssessment.Id
            where queueTicket.TenantId == tenantId &&
                  queueTicket.FacilityId == facilityId &&
                  !queueTicket.IsDeleted
            select new
            {
                queueTicket.QueueStatus,
                queueTicket.IsActive,
                queueTicket.EnteredQueueAt,
                queueTicket.CompletedAt,
                triageAssessment.UrgencyLevel,
            }).ToListAsync();

        var waitingRows = summaryRows
            .Where(item => item.IsActive && string.Equals(item.QueueStatus, PatientIntakeConstants.QueueStatusWaiting, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return new ClinicianQueueDashboardDto
        {
            TotalCount = totalCount,
            Items = outputRows,
            Summary = new ClinicianQueueSummaryDto
            {
                WaitingCount = waitingRows.Count,
                AverageWaitingMinutes = waitingRows.Count == 0
                    ? 0
                    : (int)Math.Round(waitingRows.Average(item => Math.Max(0, (nowUtc - item.EnteredQueueAt).TotalMinutes))),
                UrgentCount = summaryRows.Count(item => item.IsActive && string.Equals(item.UrgencyLevel, "Urgent", StringComparison.OrdinalIgnoreCase)),
                SeenTodayCount = summaryRows.Count(item => item.CompletedAt.HasValue && item.CompletedAt.Value >= startOfTodayUtc),
                CalledCount = summaryRows.Count(item => item.IsActive && string.Equals(item.QueueStatus, PatientIntakeConstants.QueueStatusCalled, StringComparison.OrdinalIgnoreCase)),
                InConsultationCount = summaryRows.Count(item => item.IsActive && string.Equals(item.QueueStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
            }
        };
    }

    /// <inheritdoc />
    public async Task<ClinicianQueueReviewDto> GetQueueTicketForReview(GetQueueTicketForReviewInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before reviewing queue tickets.");

        var queueProjection = await (
            from queueTicket in _queueTicketRepository.GetAll()
            join triageAssessment in _triageAssessmentRepository.GetAll() on queueTicket.TriageAssessmentId equals triageAssessment.Id
            join visit in _visitRepository.GetAll() on queueTicket.VisitId equals visit.Id
            join patientUser in _userRepository.GetAll() on visit.PatientUserId equals patientUser.Id
            join symptomIntake in _symptomIntakeRepository.GetAll() on visit.Id equals symptomIntake.VisitId into symptomIntakeGroup
            from symptomIntake in symptomIntakeGroup.DefaultIfEmpty()
            where queueTicket.TenantId == tenantId &&
                  queueTicket.FacilityId == facilityId &&
                  queueTicket.Id == input.Id &&
                  !queueTicket.IsDeleted
            select new
            {
                queueTicket.Id,
                queueTicket.VisitId,
                visit.PatientUserId,
                PatientName = string.Concat(patientUser.Name, " ", patientUser.Surname),
                queueTicket.QueueNumber,
                queueTicket.QueueStatus,
                queueTicket.CurrentStage,
                queueTicket.EnteredQueueAt,
                triageAssessment.UrgencyLevel,
                triageAssessment.PriorityScore,
                triageAssessment.Explanation,
                triageAssessment.RedFlagsDetected,
                ChiefComplaint = symptomIntake != null ? symptomIntake.FreeTextComplaint : null,
                SelectedSymptoms = symptomIntake != null ? symptomIntake.SelectedSymptoms : null,
                ExtractedPrimarySymptoms = symptomIntake != null ? symptomIntake.ExtractedPrimarySymptoms : null,
                FollowUpAnswersJson = symptomIntake != null ? symptomIntake.FollowUpAnswersJson : null,
                SubjectiveSummary = symptomIntake != null ? symptomIntake.SubjectiveSummary : null,
            }).FirstOrDefaultAsync();

        if (queueProjection == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var selectedSymptoms = DeserializeStringList(queueProjection.SelectedSymptoms);
        var extractedPrimarySymptoms = DeserializeStringList(queueProjection.ExtractedPrimarySymptoms);
        var followUpAnswers = DeserializeAnswerDictionary(queueProjection.FollowUpAnswersJson);
        var chiefComplaint = BuildChiefComplaint(queueProjection.ChiefComplaint, selectedSymptoms, extractedPrimarySymptoms, followUpAnswers);
        var reasoning = BuildReasoningItems(queueProjection.Explanation, queueProjection.RedFlagsDetected, followUpAnswers);
        var clinicianSummary = await BuildClinicianSummaryAsync(
            chiefComplaint,
            selectedSymptoms,
            extractedPrimarySymptoms,
            followUpAnswers,
            queueProjection.UrgencyLevel,
            queueProjection.Explanation,
            reasoning);
        var nowUtc = DateTime.UtcNow;

        return new ClinicianQueueReviewDto
        {
            QueueTicketId = queueProjection.Id,
            VisitId = queueProjection.VisitId,
            PatientUserId = queueProjection.PatientUserId,
            PatientName = queueProjection.PatientName.Trim(),
            QueueNumber = queueProjection.QueueNumber,
            QueueStatus = queueProjection.QueueStatus,
            CurrentStage = queueProjection.CurrentStage,
            EnteredQueueAt = queueProjection.EnteredQueueAt,
            WaitingMinutes = (int)Math.Max(0, (nowUtc - queueProjection.EnteredQueueAt).TotalMinutes),
            UrgencyLevel = queueProjection.UrgencyLevel,
            PriorityScore = queueProjection.PriorityScore,
            TriageExplanation = queueProjection.Explanation,
            RedFlags = DeserializeStringList(queueProjection.RedFlagsDetected),
            Reasoning = reasoning,
            ChiefComplaint = chiefComplaint,
            SelectedSymptoms = selectedSymptoms,
            ExtractedPrimarySymptoms = extractedPrimarySymptoms,
            SubjectiveSummary = queueProjection.SubjectiveSummary ?? string.Empty,
            ClinicianSummary = clinicianSummary,
            ConsultationPath = $"/clinician/consultation?visitId={queueProjection.VisitId}&queueTicketId={queueProjection.Id}",
            PatientHistoryPath = $"/clinician/history?patientUserId={queueProjection.PatientUserId}&visitId={queueProjection.VisitId}",
        };
    }
}
