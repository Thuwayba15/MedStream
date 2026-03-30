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
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Application service for clinician queue listing and prioritization.
/// </summary>
[AbpAuthorize]
public class QueueOperationsAppService : MedStreamAppServiceBase, IQueueOperationsAppService
{
    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;

    public QueueOperationsAppService(
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<Visit, long> visitRepository,
        IRepository<User, long> userRepository,
        UserManager userManager)
    {
        _queueTicketRepository = queueTicketRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
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

    private static HashSet<string> NormalizeFilterValues(IEnumerable<string> values)
    {
        return (values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
    }
}
