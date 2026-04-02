#nullable enable
using Abp.Authorization;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.QueueOperations;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientIntake;

public partial class PatientIntakeAppService
{
    private async Task<User> EnsureCurrentPatientUserAsync()
    {
        if (!AbpSession.UserId.HasValue)
        {
            throw new AbpAuthorizationException("Unauthenticated.");
        }

        var user = await _userRepository.GetAsync(AbpSession.UserId.Value);
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
}
