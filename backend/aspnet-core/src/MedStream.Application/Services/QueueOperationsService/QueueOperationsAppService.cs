using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientIntake;
using MedStream.QueueOperations.Dto;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Application service for clinician queue listing, review, and status transitions.
/// </summary>
[AbpAuthorize]
public class QueueOperationsAppService : MedStreamAppServiceBase, IQueueOperationsAppService
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
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;

    public QueueOperationsAppService(
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<QueueEvent, long> queueEventRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<Visit, long> visitRepository,
        IRepository<User, long> userRepository,
        UserManager userManager)
    {
        _queueTicketRepository = queueTicketRepository;
        _queueEventRepository = queueEventRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _visitRepository = visitRepository;
        _userRepository = userRepository;
        _userManager = userManager;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<ClinicianQueueItemDto>> GetClinicianQueue(GetClinicianQueueInput input)
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

        return new PagedResultDto<ClinicianQueueItemDto>(totalCount, outputRows);
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
                SubjectiveSummary = symptomIntake != null ? symptomIntake.SubjectiveSummary : null,
            }).FirstOrDefaultAsync();

        if (queueProjection == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var selectedSymptoms = DeserializeStringList(queueProjection.SelectedSymptoms);
        var extractedPrimarySymptoms = DeserializeStringList(queueProjection.ExtractedPrimarySymptoms);
        var chiefComplaint = BuildChiefComplaint(queueProjection.ChiefComplaint, selectedSymptoms, extractedPrimarySymptoms);
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
            ChiefComplaint = chiefComplaint,
            SelectedSymptoms = selectedSymptoms,
            ExtractedPrimarySymptoms = extractedPrimarySymptoms,
            SubjectiveSummary = queueProjection.SubjectiveSummary ?? string.Empty,
            ConsultationPath = $"/clinician/consultation?visitId={queueProjection.VisitId}&queueTicketId={queueProjection.Id}",
            PatientHistoryPath = $"/clinician/history?patientUserId={queueProjection.PatientUserId}&visitId={queueProjection.VisitId}",
        };
    }

    /// <inheritdoc />
    public async Task<UpdateQueueTicketStatusOutput> UpdateQueueTicketStatus(UpdateQueueTicketStatusInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before updating queue status.");

        var queueTicket = await _queueTicketRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.FacilityId == facilityId &&
            item.Id == input.QueueTicketId &&
            !item.IsDeleted);
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var oldStatus = queueTicket.QueueStatus;
        var normalizedNewStatus = (input.NewStatus ?? string.Empty).Trim().ToLowerInvariant();
        if (!AllowedTransitions.TryGetValue(oldStatus, out var allowedNewStatuses) || !allowedNewStatuses.Contains(normalizedNewStatus))
        {
            throw new UserFriendlyException($"Invalid queue transition from '{oldStatus}' to '{normalizedNewStatus}'.");
        }

        var changedAt = DateTime.UtcNow;
        queueTicket.QueueStatus = normalizedNewStatus;
        queueTicket.CurrentStage = GetStageLabelForStatus(normalizedNewStatus);
        queueTicket.LastStatusChangedAt = changedAt;
        queueTicket.CurrentClinicianUserId = clinician.Id;

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCalled, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CalledAt ??= changedAt;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.ConsultationStartedAt ??= changedAt;
            queueTicket.ConsultationStartedByClinicianUserId ??= clinician.Id;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CompletedAt = changedAt;
            queueTicket.IsActive = false;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCancelled, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CancelledAt = changedAt;
            queueTicket.IsActive = false;
        }

        await _queueTicketRepository.UpdateAsync(queueTicket);

        await _queueEventRepository.InsertAsync(new QueueEvent
        {
            TenantId = queueTicket.TenantId,
            QueueTicketId = queueTicket.Id,
            EventType = string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase)
                ? PatientIntakeConstants.QueueEventConsultationStarted
                : PatientIntakeConstants.QueueEventStatusChanged,
            OldStatus = oldStatus,
            NewStatus = normalizedNewStatus,
            ChangedByClinicianUserId = clinician.Id,
            Notes = string.IsNullOrWhiteSpace(input.Note)
                ? $"Queue status changed from '{oldStatus}' to '{normalizedNewStatus}'."
                : input.Note.Trim(),
            EventAt = changedAt,
        });

        var visit = await _visitRepository.GetAsync(queueTicket.VisitId);
        visit.Status = GetVisitStatusForQueueStatus(normalizedNewStatus);
        await _visitRepository.UpdateAsync(visit);

        await CurrentUnitOfWork.SaveChangesAsync();

        return new UpdateQueueTicketStatusOutput
        {
            QueueTicketId = queueTicket.Id,
            OldStatus = oldStatus,
            NewStatus = queueTicket.QueueStatus,
            CurrentStage = queueTicket.CurrentStage,
            ChangedAt = changedAt,
            VisitId = queueTicket.VisitId,
            PatientUserId = visit.PatientUserId,
        };
    }

    private async Task<User> EnsureCurrentClinicianAsync()
    {
        if (!AbpSession.UserId.HasValue)
        {
            throw new AbpAuthorizationException("Unauthenticated.");
        }

        var user = await _userRepository.GetAsync(AbpSession.UserId.Value);
        var roleNames = await _userManager.GetRolesAsync(user);
        if (!roleNames.Contains(StaticRoleNames.Tenants.Clinician))
        {
            throw new AbpAuthorizationException("Only clinicians may access queue operations.");
        }

        if (user.IsClinicianApprovalPending)
        {
            throw new AbpAuthorizationException("Clinician approval is pending.");
        }

        return user;
    }

    private static string GetStageLabelForStatus(string queueStatus)
    {
        return queueStatus.ToLowerInvariant() switch
        {
            PatientIntakeConstants.QueueStatusWaiting => "Waiting",
            PatientIntakeConstants.QueueStatusCalled => "Called",
            PatientIntakeConstants.QueueStatusInConsultation => "In Consultation",
            PatientIntakeConstants.QueueStatusCompleted => "Completed",
            PatientIntakeConstants.QueueStatusCancelled => "Cancelled",
            _ => "Waiting"
        };
    }

    private static string GetVisitStatusForQueueStatus(string queueStatus)
    {
        return queueStatus.ToLowerInvariant() switch
        {
            PatientIntakeConstants.QueueStatusInConsultation => "InConsultation",
            PatientIntakeConstants.QueueStatusCompleted => "Completed",
            PatientIntakeConstants.QueueStatusCancelled => "Cancelled",
            _ => PatientIntakeConstants.VisitStatusQueued
        };
    }

    private static HashSet<string> NormalizeFilterValues(IEnumerable<string> values)
    {
        return (values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
    }

    private static string BuildChiefComplaint(string freeTextComplaint, IReadOnlyList<string> selectedSymptoms, IReadOnlyList<string> extractedPrimarySymptoms)
    {
        if (!string.IsNullOrWhiteSpace(freeTextComplaint))
        {
            return freeTextComplaint.Trim();
        }

        var firstSelectedSymptom = selectedSymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstSelectedSymptom))
        {
            return firstSelectedSymptom.Trim();
        }

        var firstExtractedSymptom = extractedPrimarySymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstExtractedSymptom))
        {
            return firstExtractedSymptom.Trim();
        }

        return string.Empty;
    }

    private static List<string> DeserializeStringList(string serializedList)
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
}
