#nullable enable
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Users;
using MedStream.Consultation.Dto;
using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Consultation;

[AbpAuthorize]
public partial class ConsultationAppService : MedStreamAppServiceBase, IConsultationAppService
{
    private const int MaxEncounterSectionLength = 8000;
    private const int MaxTimelineSummaryLength = EncounterNote.MaxTimelineSummaryLength;
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<EncounterNote, long> _encounterNoteRepository;
    private readonly IRepository<VitalSigns, long> _vitalSignsRepository;
    private readonly IRepository<ConsultationTranscript, long> _consultationTranscriptRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly IConsultationDraftGenerator _consultationDraftGenerator;
    private readonly IConsultationPathwayGuidanceResolver _consultationPathwayGuidanceResolver;

    public ConsultationAppService(
        IRepository<Visit, long> visitRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<EncounterNote, long> encounterNoteRepository,
        IRepository<VitalSigns, long> vitalSignsRepository,
        IRepository<ConsultationTranscript, long> consultationTranscriptRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IConsultationDraftGenerator consultationDraftGenerator,
        IConsultationPathwayGuidanceResolver consultationPathwayGuidanceResolver)
    {
        _visitRepository = visitRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _queueTicketRepository = queueTicketRepository;
        _encounterNoteRepository = encounterNoteRepository;
        _vitalSignsRepository = vitalSignsRepository;
        _consultationTranscriptRepository = consultationTranscriptRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _consultationDraftGenerator = consultationDraftGenerator;
        _consultationPathwayGuidanceResolver = consultationPathwayGuidanceResolver;
    }

    public async Task<ConsultationWorkspaceDto> GetConsultationWorkspace(GetConsultationWorkspaceInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id, input.QueueTicketId);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        var triage = await GetTriageAssessmentAsync(visit.Id, visit.TenantId);
        var queueTicket = await GetLatestQueueTicketAsync(visit.Id, visit.TenantId, input.QueueTicketId);
        var latestVitals = await GetLatestVitalsAsync(visit.Id, visit.TenantId);
        var transcripts = await _consultationTranscriptRepository.GetAll()
            .Where(item => item.TenantId == visit.TenantId && item.EncounterNoteId == note.Id && !item.IsDeleted)
            .OrderByDescending(item => item.CapturedAt)
            .Take(10)
            .ToListAsync();
        var patient = await _userRepository.GetAsync(visit.PatientUserId);

        return new ConsultationWorkspaceDto
        {
            VisitId = visit.Id,
            QueueTicketId = queueTicket?.Id,
            VisitStatus = visit.Status,
            PatientContext = new ConsultationPatientContextDto
            {
                PatientUserId = visit.PatientUserId,
                PatientName = string.Concat(patient.Name, " ", patient.Surname).Trim(),
                FacilityId = visit.FacilityId,
                ChiefComplaint = intake?.FreeTextComplaint ?? string.Empty,
                SubjectiveSummary = intake?.SubjectiveSummary ?? string.Empty,
                UrgencyLevel = triage?.UrgencyLevel ?? string.Empty,
                QueueStatus = queueTicket?.QueueStatus ?? string.Empty,
                VisitDate = visit.VisitDate
            },
            EncounterNote = MapEncounterNote(note),
            LatestVitals = latestVitals == null ? null : MapVitalSigns(latestVitals),
            Transcripts = transcripts.Select(MapTranscript).ToList()
        };
    }

    public async Task<ConsultationInboxDto> GetConsultationInbox()
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var startOfTodayUtc = DateTime.UtcNow.Date;
        var rows = await (
            from visit in _visitRepository.GetAll()
            join patient in _userRepository.GetAll() on visit.PatientUserId equals patient.Id
            join intake in _symptomIntakeRepository.GetAll() on visit.Id equals intake.VisitId into intakeGroup
            from intake in intakeGroup.DefaultIfEmpty()
            join note in _encounterNoteRepository.GetAll() on visit.Id equals note.VisitId into noteGroup
            from note in noteGroup.DefaultIfEmpty()
            join triage in _triageAssessmentRepository.GetAll() on visit.Id equals triage.VisitId into triageGroup
            from triage in triageGroup.DefaultIfEmpty()
            join queueTicket in _queueTicketRepository.GetAll() on visit.Id equals queueTicket.VisitId into queueGroup
            from queueTicket in queueGroup.DefaultIfEmpty()
            where visit.TenantId == tenantId && !visit.IsDeleted && visit.AssignedClinicianUserId == clinician.Id && visit.VisitDate >= startOfTodayUtc
            select new
            {
                visit.Id,
                visit.PatientUserId,
                visit.VisitDate,
                PatientName = string.Concat(patient.Name, " ", patient.Surname),
                ChiefComplaint = intake != null ? intake.FreeTextComplaint : null,
                SubjectiveSummary = intake != null ? intake.SubjectiveSummary : null,
                QueueTicketId = queueTicket != null ? (long?)queueTicket.Id : null,
                QueueStatus = queueTicket != null ? queueTicket.QueueStatus : string.Empty,
                UrgencyLevel = triage != null ? triage.UrgencyLevel : string.Empty,
                EncounterNoteStatus = note != null ? note.Status : string.Empty,
                note.FinalizedAt,
                NoteId = note != null ? (long?)note.Id : null,
                QueueSortAt = queueTicket != null ? (DateTime?)queueTicket.LastStatusChangedAt : null,
            }).ToListAsync();

        var noteIds = rows.Where(item => item.NoteId.HasValue).Select(item => item.NoteId!.Value).Distinct().ToList();
        var lastTranscriptLookup = noteIds.Count == 0
            ? new System.Collections.Generic.Dictionary<long, DateTime?>()
            : await _consultationTranscriptRepository.GetAll()
                .Where(item => item.TenantId == tenantId && noteIds.Contains(item.EncounterNoteId) && !item.IsDeleted)
                .GroupBy(item => item.EncounterNoteId)
                .Select(group => new { EncounterNoteId = group.Key, LastTranscriptAt = group.Max(item => (DateTime?)item.CapturedAt) })
                .ToDictionaryAsync(item => item.EncounterNoteId, item => item.LastTranscriptAt);

        return new ConsultationInboxDto
        {
            Items = rows
                .OrderByDescending(item => item.QueueSortAt ?? item.FinalizedAt ?? item.VisitDate)
                .Select(item => new ConsultationInboxItemDto
                {
                    VisitId = item.Id,
                    QueueTicketId = item.QueueTicketId,
                    PatientUserId = item.PatientUserId,
                    PatientName = item.PatientName.Trim(),
                    ChiefComplaint = item.ChiefComplaint ?? string.Empty,
                    SubjectiveSummary = item.SubjectiveSummary ?? string.Empty,
                    QueueStatus = item.QueueStatus,
                    UrgencyLevel = item.UrgencyLevel,
                    EncounterNoteStatus = item.EncounterNoteStatus ?? PatientIntakeConstants.EncounterNoteStatusDraft,
                    VisitDate = item.VisitDate,
                    FinalizedAt = item.FinalizedAt,
                    LastTranscriptAt = item.NoteId.HasValue && lastTranscriptLookup.TryGetValue(item.NoteId.Value, out var lastTranscriptAt) ? lastTranscriptAt : null,
                    ConsultationPath = item.QueueTicketId.HasValue ? $"/clinician/consultation?visitId={item.Id}&queueTicketId={item.QueueTicketId.Value}" : $"/clinician/consultation?visitId={item.Id}"
                })
                .ToList()
        };
    }
}
