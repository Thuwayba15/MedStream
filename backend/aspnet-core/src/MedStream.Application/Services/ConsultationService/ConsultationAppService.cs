#nullable enable
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Consultation.Dto;
using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Consultation;

[AbpAuthorize]
public class ConsultationAppService : MedStreamAppServiceBase, IConsultationAppService
{
    private const int MaxEncounterSectionLength = 8000;
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
            where visit.TenantId == tenantId &&
                  !visit.IsDeleted &&
                  visit.AssignedClinicianUserId == clinician.Id &&
                  visit.VisitDate >= startOfTodayUtc
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

        var noteIds = rows
            .Where(item => item.NoteId.HasValue)
            .Select(item => item.NoteId!.Value)
            .Distinct()
            .ToList();

        var lastTranscriptLookup = noteIds.Count == 0
            ? new Dictionary<long, DateTime?>()
            : await _consultationTranscriptRepository.GetAll()
                .Where(item => item.TenantId == tenantId && noteIds.Contains(item.EncounterNoteId) && !item.IsDeleted)
                .GroupBy(item => item.EncounterNoteId)
                .Select(group => new
                {
                    EncounterNoteId = group.Key,
                    LastTranscriptAt = group.Max(item => (DateTime?)item.CapturedAt)
                })
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
                    LastTranscriptAt = item.NoteId.HasValue && lastTranscriptLookup.TryGetValue(item.NoteId.Value, out var lastTranscriptAt)
                        ? lastTranscriptAt
                        : null,
                    ConsultationPath = item.QueueTicketId.HasValue
                        ? $"/clinician/consultation?visitId={item.Id}&queueTicketId={item.QueueTicketId.Value}"
                        : $"/clinician/consultation?visitId={item.Id}"
                })
                .ToList()
        };
    }

    public async Task<ConsultationVitalSignsDto> SaveVitals(SaveVitalsInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);

        var existingLatestVitals = await _vitalSignsRepository.GetAll()
            .Where(item => item.TenantId == visit.TenantId && item.VisitId == visit.Id && item.IsLatest && !item.IsDeleted)
            .ToListAsync();
        foreach (var existingVitals in existingLatestVitals)
        {
            existingVitals.IsLatest = false;
            await _vitalSignsRepository.UpdateAsync(existingVitals);
        }

        var vitals = await _vitalSignsRepository.InsertAsync(new VitalSigns
        {
            TenantId = visit.TenantId,
            VisitId = visit.Id,
            RecordedByClinicianUserId = clinician.Id,
            Phase = NormalizeVitalPhase(input.Phase),
            BloodPressureSystolic = input.BloodPressureSystolic,
            BloodPressureDiastolic = input.BloodPressureDiastolic,
            HeartRate = input.HeartRate,
            RespiratoryRate = input.RespiratoryRate,
            TemperatureCelsius = input.TemperatureCelsius,
            OxygenSaturation = input.OxygenSaturation,
            BloodGlucose = input.BloodGlucose,
            WeightKg = input.WeightKg,
            IsLatest = true,
            RecordedAt = DateTime.UtcNow
        });

        await CurrentUnitOfWork.SaveChangesAsync();
        return MapVitalSigns(vitals);
    }

    public async Task<EncounterNoteDto> SaveEncounterNoteDraft(SaveEncounterNoteDraftInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        EnsureEncounterNoteIsEditable(note);

        if (input.Subjective != null)
        {
            note.Subjective = SanitizeSection(input.Subjective);
        }

        if (input.Objective != null)
        {
            note.Objective = SanitizeSection(input.Objective);
        }

        if (input.Assessment != null)
        {
            note.Assessment = SanitizeSection(input.Assessment);
        }

        if (input.Plan != null)
        {
            note.Plan = SanitizeSection(input.Plan);
        }

        note.Status = PatientIntakeConstants.EncounterNoteStatusDraft;
        await _encounterNoteRepository.UpdateAsync(note);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapEncounterNote(note);
    }

    public async Task<ConsultationTranscriptDto> AttachConsultationTranscript(AttachConsultationTranscriptInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        EnsureEncounterNoteIsEditable(note);

        var transcript = await _consultationTranscriptRepository.InsertAsync(new ConsultationTranscript
        {
            TenantId = visit.TenantId,
            EncounterNoteId = note.Id,
            CapturedByClinicianUserId = clinician.Id,
            InputMode = NormalizeTranscriptInputMode(input.InputMode),
            RawTranscriptText = input.RawTranscriptText.Trim(),
            TranslatedTranscriptText = string.IsNullOrWhiteSpace(input.TranslatedTranscriptText) ? null : input.TranslatedTranscriptText.Trim(),
            LanguageDetected = string.IsNullOrWhiteSpace(input.LanguageDetected) ? null : input.LanguageDetected.Trim(),
            CapturedAt = DateTime.UtcNow
        });

        await CurrentUnitOfWork.SaveChangesAsync();
        return MapTranscript(transcript);
    }

    public async Task<ConsultationAiDraftDto> GenerateSubjectiveDraft(GenerateConsultationDraftInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        EnsureEncounterNoteIsEditable(note);

        var context = await BuildDraftContextAsync(visit, note, intake);
        var draft = await _consultationDraftGenerator.GenerateSubjectiveDraftAsync(context);

        return new ConsultationAiDraftDto
        {
            VisitId = visit.Id,
            EncounterNoteId = note.Id,
            Source = draft.Source,
            GeneratedAt = DateTime.UtcNow,
            Subjective = draft.Subjective,
            Summary = draft.Summary
        };
    }

    public async Task<ConsultationAiDraftDto> GenerateAssessmentPlanDraft(GenerateConsultationDraftInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        EnsureEncounterNoteIsEditable(note);

        var context = await BuildDraftContextAsync(visit, note, intake);
        if (string.IsNullOrWhiteSpace(context.CurrentSubjective) && string.IsNullOrWhiteSpace(context.IntakeSubjective))
        {
            throw new UserFriendlyException("Add or confirm subjective information before generating assessment and plan.");
        }

        if (string.IsNullOrWhiteSpace(context.CurrentObjective) && string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            throw new UserFriendlyException("Record objective findings or vitals before generating assessment and plan.");
        }

        var draft = await _consultationDraftGenerator.GenerateAssessmentPlanDraftAsync(context);
        return new ConsultationAiDraftDto
        {
            VisitId = visit.Id,
            EncounterNoteId = note.Id,
            Source = draft.Source,
            GeneratedAt = DateTime.UtcNow,
            Assessment = draft.Assessment,
            Plan = draft.Plan,
            Summary = draft.Summary
        };
    }

    public async Task<EncounterNoteDto> FinalizeEncounterNote(FinalizeEncounterNoteInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var visit = await GetAccessibleVisitAsync(input.VisitId, clinician.Id);
        await EnsureVisitIsEditableAsync(visit);
        var intake = await GetSymptomIntakeAsync(visit);
        var note = await GetOrCreateEncounterNoteAsync(visit, intake, clinician.Id);
        var latestVitals = await GetLatestVitalsAsync(visit.Id, visit.TenantId);
        EnsureEncounterNoteIsEditable(note);

        if (string.IsNullOrWhiteSpace(note.Subjective))
        {
            throw new UserFriendlyException("Subjective must be completed before finalizing the note.");
        }

        if (string.IsNullOrWhiteSpace(note.Objective) && latestVitals == null)
        {
            throw new UserFriendlyException("Add objective findings or save consultation vitals before finalizing the note.");
        }

        if (string.IsNullOrWhiteSpace(note.Assessment))
        {
            throw new UserFriendlyException("Assessment must be completed before finalizing the note.");
        }

        if (string.IsNullOrWhiteSpace(note.Plan))
        {
            throw new UserFriendlyException("Plan must be completed before finalizing the note.");
        }

        note.Status = PatientIntakeConstants.EncounterNoteStatusFinalized;
        note.FinalizedAt = DateTime.UtcNow;
        await _encounterNoteRepository.UpdateAsync(note);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapEncounterNote(note);
    }

    private async Task<ConsultationDraftContext> BuildDraftContextAsync(Visit visit, EncounterNote note, SymptomIntake? intake)
    {
        var latestVitals = await GetLatestVitalsAsync(visit.Id, visit.TenantId);
        var triage = await GetTriageAssessmentAsync(visit.Id, visit.TenantId);
        var transcripts = await _consultationTranscriptRepository.GetAll()
            .Where(item => item.TenantId == visit.TenantId && item.EncounterNoteId == note.Id && !item.IsDeleted)
            .OrderByDescending(item => item.CapturedAt)
            .Take(5)
            .ToListAsync();
        var guidance = _consultationPathwayGuidanceResolver.Resolve(visit.PathwayKey, intake?.FreeTextComplaint);

        return new ConsultationDraftContext
        {
            PathwayId = guidance.PathwayId,
            PathwayName = guidance.PathwayName,
            ChiefComplaint = intake?.FreeTextComplaint ?? string.Empty,
            IntakeSubjective = note.IntakeSubjective ?? intake?.SubjectiveSummary ?? string.Empty,
            CurrentSubjective = note.Subjective ?? string.Empty,
            CurrentObjective = note.Objective ?? string.Empty,
            CurrentAssessment = note.Assessment ?? string.Empty,
            CurrentPlan = note.Plan ?? string.Empty,
            UrgencyLevel = triage?.UrgencyLevel ?? string.Empty,
            TriageExplanation = triage?.Explanation ?? string.Empty,
            LatestVitalsSummary = BuildVitalsSummary(latestVitals),
            PathwayAssessmentHints = guidance.PathwayAssessmentHints,
            PathwayPlanHints = guidance.PathwayPlanHints,
            ObjectiveFocusHints = guidance.ObjectiveFocusHints,
            ApcReferenceLinks = guidance.ApcReferenceLinks,
            TranscriptSegments = transcripts.Select(item => item.RawTranscriptText).Where(item => !string.IsNullOrWhiteSpace(item)).ToList()
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
        var visit = await _visitRepository.FirstOrDefaultAsync(item =>
            item.Id == visitId &&
            item.TenantId == tenantId &&
            !item.IsDeleted);
        if (visit == null)
        {
            throw new UserFriendlyException("Visit was not found.");
        }

        var queueTicketQuery = _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.VisitId == visit.Id && !item.IsDeleted);
        if (queueTicketId.HasValue)
        {
            queueTicketQuery = queueTicketQuery.Where(item => item.Id == queueTicketId.Value);
        }

        var queueTicket = await queueTicketQuery
            .OrderByDescending(item => item.LastStatusChangedAt)
            .FirstOrDefaultAsync();

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

    private async Task<SymptomIntake?> GetSymptomIntakeAsync(Visit visit)
    {
        return await _symptomIntakeRepository.FirstOrDefaultAsync(item =>
            item.TenantId == visit.TenantId &&
            item.VisitId == visit.Id &&
            !item.IsDeleted);
    }

    private async Task<TriageAssessment?> GetTriageAssessmentAsync(long visitId, int tenantId)
    {
        return await _triageAssessmentRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.VisitId == visitId &&
            !item.IsDeleted);
    }

    private async Task<QueueTicket?> GetLatestQueueTicketAsync(long visitId, int tenantId, long? queueTicketId)
    {
        var query = _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.VisitId == visitId && !item.IsDeleted);

        if (queueTicketId.HasValue)
        {
            query = query.Where(item => item.Id == queueTicketId.Value);
        }

        return await query
            .OrderByDescending(item => item.LastStatusChangedAt)
            .FirstOrDefaultAsync();
    }

    private async Task<EncounterNote> GetOrCreateEncounterNoteAsync(Visit visit, SymptomIntake? intake, long clinicianUserId)
    {
        var note = await _encounterNoteRepository.FirstOrDefaultAsync(item =>
            item.TenantId == visit.TenantId &&
            item.VisitId == visit.Id &&
            !item.IsDeleted);
        if (note != null)
        {
            if (string.IsNullOrWhiteSpace(note.IntakeSubjective) && !string.IsNullOrWhiteSpace(intake?.SubjectiveSummary))
            {
                note.IntakeSubjective = intake.SubjectiveSummary.Trim();
                if (string.IsNullOrWhiteSpace(note.Subjective))
                {
                    note.Subjective = note.IntakeSubjective;
                }

                await _encounterNoteRepository.UpdateAsync(note);
                await CurrentUnitOfWork.SaveChangesAsync();
            }

            return note;
        }

        note = await _encounterNoteRepository.InsertAsync(new EncounterNote
        {
            TenantId = visit.TenantId,
            VisitId = visit.Id,
            CreatedByClinicianUserId = clinicianUserId,
            IntakeSubjective = intake?.SubjectiveSummary?.Trim() ?? string.Empty,
            Subjective = intake?.SubjectiveSummary?.Trim() ?? string.Empty,
            Status = PatientIntakeConstants.EncounterNoteStatusDraft
        });
        await CurrentUnitOfWork.SaveChangesAsync();
        return note;
    }

    private async Task<VitalSigns?> GetLatestVitalsAsync(long visitId, int tenantId)
    {
        return await _vitalSignsRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.VisitId == visitId && item.IsLatest && !item.IsDeleted)
            .OrderByDescending(item => item.RecordedAt)
            .FirstOrDefaultAsync();
    }

    private static EncounterNoteDto MapEncounterNote(EncounterNote note)
    {
        return new EncounterNoteDto
        {
            Id = note.Id,
            VisitId = note.VisitId,
            IntakeSubjective = note.IntakeSubjective ?? string.Empty,
            Subjective = note.Subjective ?? string.Empty,
            Objective = note.Objective ?? string.Empty,
            Assessment = note.Assessment ?? string.Empty,
            Plan = note.Plan ?? string.Empty,
            Status = note.Status ?? string.Empty,
            FinalizedAt = note.FinalizedAt
        };
    }

    private static ConsultationVitalSignsDto MapVitalSigns(VitalSigns vitals)
    {
        return new ConsultationVitalSignsDto
        {
            Id = vitals.Id,
            VisitId = vitals.VisitId,
            Phase = vitals.Phase,
            BloodPressureSystolic = vitals.BloodPressureSystolic,
            BloodPressureDiastolic = vitals.BloodPressureDiastolic,
            HeartRate = vitals.HeartRate,
            RespiratoryRate = vitals.RespiratoryRate,
            TemperatureCelsius = vitals.TemperatureCelsius,
            OxygenSaturation = vitals.OxygenSaturation,
            BloodGlucose = vitals.BloodGlucose,
            WeightKg = vitals.WeightKg,
            IsLatest = vitals.IsLatest,
            RecordedAt = vitals.RecordedAt
        };
    }

    private static ConsultationTranscriptDto MapTranscript(ConsultationTranscript transcript)
    {
        return new ConsultationTranscriptDto
        {
            Id = transcript.Id,
            EncounterNoteId = transcript.EncounterNoteId,
            InputMode = transcript.InputMode,
            RawTranscriptText = transcript.RawTranscriptText,
            TranslatedTranscriptText = transcript.TranslatedTranscriptText,
            LanguageDetected = transcript.LanguageDetected,
            CapturedAt = transcript.CapturedAt
        };
    }

    private static string NormalizeVitalPhase(string phase)
    {
        return phase.Trim().ToLowerInvariant() switch
        {
            PatientIntakeConstants.VitalSignsPhaseTriage => PatientIntakeConstants.VitalSignsPhaseTriage,
            PatientIntakeConstants.VitalSignsPhaseConsultation => PatientIntakeConstants.VitalSignsPhaseConsultation,
            _ => throw new UserFriendlyException("Unsupported vitals phase.")
        };
    }

    private static string NormalizeTranscriptInputMode(string inputMode)
    {
        return inputMode.Trim().ToLowerInvariant() switch
        {
            PatientIntakeConstants.TranscriptInputModeTyped => PatientIntakeConstants.TranscriptInputModeTyped,
            PatientIntakeConstants.TranscriptInputModeAudioUpload => PatientIntakeConstants.TranscriptInputModeAudioUpload,
            _ => throw new UserFriendlyException("Unsupported transcript input mode.")
        };
    }

    private static string SanitizeSection(string value)
    {
        var safeValue = (value ?? string.Empty).Trim();
        return safeValue.Length <= MaxEncounterSectionLength
            ? safeValue
            : safeValue[..MaxEncounterSectionLength];
    }

    private static string BuildVitalsSummary(VitalSigns? vitals)
    {
        if (vitals == null)
        {
            return string.Empty;
        }

        var parts = new List<string>();
        if (vitals.BloodPressureSystolic.HasValue || vitals.BloodPressureDiastolic.HasValue)
        {
            parts.Add($"BP {vitals.BloodPressureSystolic?.ToString() ?? "?"}/{vitals.BloodPressureDiastolic?.ToString() ?? "?"}");
        }

        if (vitals.HeartRate.HasValue)
        {
            parts.Add($"HR {vitals.HeartRate.Value} bpm");
        }

        if (vitals.RespiratoryRate.HasValue)
        {
            parts.Add($"RR {vitals.RespiratoryRate.Value}/min");
        }

        if (vitals.TemperatureCelsius.HasValue)
        {
            parts.Add($"Temp {vitals.TemperatureCelsius.Value:0.0} C");
        }

        if (vitals.OxygenSaturation.HasValue)
        {
            parts.Add($"SpO2 {vitals.OxygenSaturation.Value}%");
        }

        if (vitals.BloodGlucose.HasValue)
        {
            parts.Add($"Glucose {vitals.BloodGlucose.Value:0.##}");
        }

        if (vitals.WeightKg.HasValue)
        {
            parts.Add($"Weight {vitals.WeightKg.Value:0.##} kg");
        }

        return string.Join(", ", parts);
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
