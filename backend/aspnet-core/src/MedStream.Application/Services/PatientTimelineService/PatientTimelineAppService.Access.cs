#nullable enable
using Abp.Authorization;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientAccess;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientTimeline;

public partial class PatientTimelineAppService
{
    private async Task<HistoryAccessContext> EnsureClinicianCanViewTimelineAsync(long patientUserId, User clinician)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var assignedVisitId = await _visitRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.PatientUserId == patientUserId && item.AssignedClinicianUserId == clinician.Id && !item.IsDeleted)
            .OrderByDescending(item => item.VisitDate)
            .Select(item => (long?)item.Id)
            .FirstOrDefaultAsync();
        if (assignedVisitId.HasValue)
        {
            return new HistoryAccessContext(PatientAccessConstants.AccessReasonAssignedVisit, assignedVisitId.Value);
        }

        var activeGrant = await _patientAccessGrantRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.PatientUserId == patientUserId && item.ClinicianUserId == clinician.Id && item.IsActive && !item.IsDeleted)
            .OrderByDescending(item => item.GrantedAt)
            .FirstOrDefaultAsync();
        if (activeGrant != null && (!activeGrant.ExpiresAt.HasValue || activeGrant.ExpiresAt.Value >= DateTime.UtcNow))
        {
            return new HistoryAccessContext(PatientAccessConstants.AccessReasonActiveGrant, activeGrant.VisitId);
        }

        throw new AbpAuthorizationException("You do not have access to this patient's history.");
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
            throw new AbpAuthorizationException("Only clinicians may access patient timeline endpoints.");
        }

        if (user.IsClinicianApprovalPending || !user.ClinicianFacilityId.HasValue)
        {
            throw new AbpAuthorizationException("Clinician access is not active.");
        }

        return user;
    }

    private async Task<User> EnsureCurrentPatientAsync()
    {
        if (!AbpSession.UserId.HasValue)
        {
            throw new AbpAuthorizationException("Unauthenticated.");
        }

        var user = await _userRepository.GetAsync(AbpSession.UserId.Value);
        var roleNames = await _userManager.GetRolesAsync(user);
        if (!roleNames.Contains(StaticRoleNames.Tenants.Patient))
        {
            throw new AbpAuthorizationException("Only patients may access self-history endpoints.");
        }

        return user;
    }
}
