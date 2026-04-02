#nullable enable
using Abp.Authorization;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientIntake;
using MedStream.QueueOperations.Dto;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

public partial class QueueOperationsAppService
{
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
        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            var encounterNote = await _encounterNoteRepository.FirstOrDefaultAsync(item =>
                item.TenantId == tenantId &&
                item.VisitId == visit.Id &&
                !item.IsDeleted);
            if (encounterNote == null || !string.Equals(encounterNote.Status, PatientIntakeConstants.EncounterNoteStatusFinalized, StringComparison.OrdinalIgnoreCase))
            {
                throw new UserFriendlyException("Encounter note must be finalized before completing the visit.");
            }
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
        {
            visit.AssignedClinicianUserId ??= clinician.Id;
        }

        visit.Status = GetVisitStatusForQueueStatus(normalizedNewStatus);
        await _visitRepository.UpdateAsync(visit);

        await CurrentUnitOfWork.SaveChangesAsync();
        if (_queueRealtimeNotifier != null)
        {
            await _queueRealtimeNotifier.NotifyFacilityQueueChangedAsync(queueTicket.FacilityId);
            await _queueRealtimeNotifier.NotifyPatientQueueChangedAsync(visit.PatientUserId, visit.Id, queueTicket.Id);
        }

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

    /// <inheritdoc />
    [HttpPost]
    public async Task<OverrideQueueTicketUrgencyOutput> OverrideQueueTicketUrgency(OverrideQueueTicketUrgencyInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before overriding urgency.");
        var normalizedUrgencyLevel = NormalizeUrgencyLevel(input.UrgencyLevel);

        var queueTicket = await _queueTicketRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.FacilityId == facilityId &&
            item.Id == input.QueueTicketId &&
            !item.IsDeleted);
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var triageAssessment = await _triageAssessmentRepository.GetAsync(queueTicket.TriageAssessmentId);
        var previousUrgencyLevel = triageAssessment.UrgencyLevel;

        triageAssessment.UrgencyLevel = normalizedUrgencyLevel;
        triageAssessment.PriorityScore = GetPriorityScoreForUrgency(normalizedUrgencyLevel, triageAssessment.PriorityScore);
        triageAssessment.Explanation = string.IsNullOrWhiteSpace(input.Note)
            ? $"Urgency overridden by clinician to {normalizedUrgencyLevel}."
            : $"{triageAssessment.Explanation} Override: {input.Note.Trim()}".Trim();

        await _triageAssessmentRepository.UpdateAsync(triageAssessment);

        await _queueEventRepository.InsertAsync(new QueueEvent
        {
            TenantId = queueTicket.TenantId,
            QueueTicketId = queueTicket.Id,
            EventType = PatientIntakeConstants.QueueEventStatusChanged,
            OldStatus = queueTicket.QueueStatus,
            NewStatus = queueTicket.QueueStatus,
            ChangedByClinicianUserId = clinician.Id,
            Notes = string.IsNullOrWhiteSpace(input.Note)
                ? $"Urgency overridden from '{previousUrgencyLevel}' to '{normalizedUrgencyLevel}'."
                : $"Urgency overridden from '{previousUrgencyLevel}' to '{normalizedUrgencyLevel}'. {input.Note.Trim()}",
            EventAt = DateTime.UtcNow,
        });

        await CurrentUnitOfWork.SaveChangesAsync();
        var visit = await _visitRepository.GetAsync(queueTicket.VisitId);
        if (_queueRealtimeNotifier != null)
        {
            await _queueRealtimeNotifier.NotifyFacilityQueueChangedAsync(queueTicket.FacilityId);
            await _queueRealtimeNotifier.NotifyPatientQueueChangedAsync(visit.PatientUserId, queueTicket.VisitId, queueTicket.Id);
        }

        return new OverrideQueueTicketUrgencyOutput
        {
            QueueTicketId = queueTicket.Id,
            VisitId = queueTicket.VisitId,
            PatientUserId = visit.PatientUserId,
            PreviousUrgencyLevel = previousUrgencyLevel,
            UrgencyLevel = triageAssessment.UrgencyLevel,
            PriorityScore = triageAssessment.PriorityScore,
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

    private static string NormalizeUrgencyLevel(string urgencyLevel)
    {
        return urgencyLevel?.Trim().ToLowerInvariant() switch
        {
            "urgent" => "Urgent",
            "priority" => "Priority",
            "routine" => "Routine",
            _ => throw new UserFriendlyException("Urgency override must be Urgent, Priority, or Routine.")
        };
    }

    private static decimal GetPriorityScoreForUrgency(string urgencyLevel, decimal existingPriorityScore)
    {
        return urgencyLevel switch
        {
            "Urgent" => Math.Max(existingPriorityScore, 90m),
            "Priority" => Math.Clamp(existingPriorityScore, 60m, 89m),
            "Routine" => Math.Min(existingPriorityScore, 59m),
            _ => existingPriorityScore
        };
    }

    private static bool GetBooleanAnswer(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (answers == null || !answers.TryGetValue(key, out var answer) || answer == null)
        {
            return false;
        }

        if (answer is bool booleanValue)
        {
            return booleanValue;
        }

        if (bool.TryParse(Convert.ToString(answer), out var parsedBoolean))
        {
            return parsedBoolean;
        }

        return false;
    }
}
