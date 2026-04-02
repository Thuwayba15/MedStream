#nullable enable
using Abp.Authorization;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Consultation;

public partial class ConsultationAppService
{
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
            throw new AbpAuthorizationException("Only clinicians may access consultation endpoints.");
        }

        if (user.IsClinicianApprovalPending)
        {
            throw new AbpAuthorizationException("Clinician approval is pending.");
        }

        if (!user.ClinicianFacilityId.HasValue)
        {
            throw new AbpAuthorizationException("Clinician must be assigned to a facility.");
        }

        return user;
    }

    private async Task<Visit> GetAccessibleVisitAsync(long visitId, long clinicianUserId, long? queueTicketId = null)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var visit = await _visitRepository.FirstOrDefaultAsync(item => item.Id == visitId && item.TenantId == tenantId && !item.IsDeleted);
        if (visit == null)
        {
            throw new UserFriendlyException("Visit was not found.");
        }

        var queueTicketQuery = _queueTicketRepository.GetAll().Where(item => item.TenantId == tenantId && item.VisitId == visit.Id && !item.IsDeleted);
        if (queueTicketId.HasValue)
        {
            queueTicketQuery = queueTicketQuery.Where(item => item.Id == queueTicketId.Value);
        }

        var queueTicket = await queueTicketQuery.OrderByDescending(item => item.LastStatusChangedAt).FirstOrDefaultAsync();

        if (visit.AssignedClinicianUserId.HasValue && visit.AssignedClinicianUserId != clinicianUserId)
        {
            throw new AbpAuthorizationException("This visit is assigned to another clinician.");
        }

        if (queueTicket != null && queueTicket.CurrentClinicianUserId.HasValue && queueTicket.CurrentClinicianUserId != clinicianUserId)
        {
            throw new AbpAuthorizationException("This queue ticket is currently owned by another clinician.");
        }

        if (!visit.AssignedClinicianUserId.HasValue)
        {
            visit.AssignedClinicianUserId = clinicianUserId;
            await _visitRepository.UpdateAsync(visit);
        }

        if (queueTicket != null && !queueTicket.CurrentClinicianUserId.HasValue)
        {
            queueTicket.CurrentClinicianUserId = clinicianUserId;
            await _queueTicketRepository.UpdateAsync(queueTicket);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return visit;
    }

    private static Task EnsureVisitIsEditableAsync(Visit visit)
    {
        if (string.Equals(visit.Status, PatientIntakeConstants.VisitStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            throw new UserFriendlyException("Completed visits cannot be edited in consultation.");
        }

        return Task.CompletedTask;
    }

    private static void EnsureEncounterNoteIsEditable(EncounterNote note)
    {
        if (string.Equals(note.Status, PatientIntakeConstants.EncounterNoteStatusFinalized, StringComparison.OrdinalIgnoreCase))
        {
            throw new UserFriendlyException("Finalized encounter notes cannot be edited.");
        }
    }
}
