#nullable enable
using Abp.Authorization;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientAccess;
using MedStream.PatientIntake;
using MedStream.PatientTimeline.Dto;
using System;
using System.Threading.Tasks;

namespace MedStream.PatientTimeline;

[AbpAuthorize]
public partial class PatientTimelineAppService : MedStreamAppServiceBase, IPatientTimelineAppService
{
    private readonly Abp.Domain.Repositories.IRepository<User, long> _userRepository;
    private readonly Abp.Domain.Repositories.IRepository<Visit, long> _visitRepository;
    private readonly Abp.Domain.Repositories.IRepository<Facility, int> _facilityRepository;
    private readonly Abp.Domain.Repositories.IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly Abp.Domain.Repositories.IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly Abp.Domain.Repositories.IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly Abp.Domain.Repositories.IRepository<QueueEvent, long> _queueEventRepository;
    private readonly Abp.Domain.Repositories.IRepository<EncounterNote, long> _encounterNoteRepository;
    private readonly Abp.Domain.Repositories.IRepository<VitalSigns, long> _vitalSignsRepository;
    private readonly Abp.Domain.Repositories.IRepository<PatientAccessGrant, long> _patientAccessGrantRepository;
    private readonly Abp.Domain.Repositories.IRepository<PatientAccessAudit, long> _patientAccessAuditRepository;
    private readonly Authorization.Users.UserManager _userManager;

    public PatientTimelineAppService(
        Abp.Domain.Repositories.IRepository<User, long> userRepository,
        Abp.Domain.Repositories.IRepository<Visit, long> visitRepository,
        Abp.Domain.Repositories.IRepository<Facility, int> facilityRepository,
        Abp.Domain.Repositories.IRepository<SymptomIntake, long> symptomIntakeRepository,
        Abp.Domain.Repositories.IRepository<TriageAssessment, long> triageAssessmentRepository,
        Abp.Domain.Repositories.IRepository<QueueTicket, long> queueTicketRepository,
        Abp.Domain.Repositories.IRepository<QueueEvent, long> queueEventRepository,
        Abp.Domain.Repositories.IRepository<EncounterNote, long> encounterNoteRepository,
        Abp.Domain.Repositories.IRepository<VitalSigns, long> vitalSignsRepository,
        Abp.Domain.Repositories.IRepository<PatientAccessGrant, long> patientAccessGrantRepository,
        Abp.Domain.Repositories.IRepository<PatientAccessAudit, long> patientAccessAuditRepository,
        Authorization.Users.UserManager userManager)
    {
        _userRepository = userRepository;
        _visitRepository = visitRepository;
        _facilityRepository = facilityRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _queueTicketRepository = queueTicketRepository;
        _queueEventRepository = queueEventRepository;
        _encounterNoteRepository = encounterNoteRepository;
        _vitalSignsRepository = vitalSignsRepository;
        _patientAccessGrantRepository = patientAccessGrantRepository;
        _patientAccessAuditRepository = patientAccessAuditRepository;
        _userManager = userManager;
    }

    public async Task<PatientTimelineDto> GetPatientTimeline(GetPatientTimelineInput input)
    {
        if (input.PatientUserId <= 0)
        {
            throw new UserFriendlyException("Patient user id is required.");
        }

        var clinician = await EnsureCurrentClinicianAsync();
        var accessContext = await EnsureClinicianCanViewTimelineAsync(input.PatientUserId, clinician);
        var timeline = await BuildTimelineAsync(input.PatientUserId, isClinicianView: true);

        await _patientAccessAuditRepository.InsertAsync(new PatientAccessAudit
        {
            TenantId = AbpSession.TenantId ?? 1,
            PatientUserId = input.PatientUserId,
            ClinicianUserId = clinician.Id,
            VisitId = accessContext.VisitId,
            FacilityId = clinician.ClinicianFacilityId,
            AccessType = PatientAccessConstants.AccessTypeTimelineRead,
            AccessReason = accessContext.AccessReason,
            Notes = "Patient timeline viewed.",
            AccessedAt = DateTime.UtcNow
        });
        await CurrentUnitOfWork.SaveChangesAsync();

        return timeline;
    }

    public async Task<PatientTimelineDto> GetMyTimeline()
    {
        var patient = await EnsureCurrentPatientAsync();
        return await BuildTimelineAsync(patient.Id, isClinicianView: false);
    }

    private readonly record struct HistoryAccessContext(string AccessReason, long? VisitId);
}
