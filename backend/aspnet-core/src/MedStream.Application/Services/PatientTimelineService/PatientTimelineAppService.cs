#nullable enable
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientAccess;
using MedStream.PatientIntake;
using MedStream.PatientTimeline.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientTimeline;

/// <summary>
/// Read model service for patient history across visits and facilities.
/// </summary>
[AbpAuthorize]
public class PatientTimelineAppService : MedStreamAppServiceBase, IPatientTimelineAppService
{
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<Facility, int> _facilityRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<QueueEvent, long> _queueEventRepository;
    private readonly IRepository<EncounterNote, long> _encounterNoteRepository;
    private readonly IRepository<VitalSigns, long> _vitalSignsRepository;
    private readonly IRepository<PatientAccessGrant, long> _patientAccessGrantRepository;
    private readonly IRepository<PatientAccessAudit, long> _patientAccessAuditRepository;
    private readonly UserManager _userManager;

    public PatientTimelineAppService(
        IRepository<User, long> userRepository,
        IRepository<Visit, long> visitRepository,
        IRepository<Facility, int> facilityRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<QueueEvent, long> queueEventRepository,
        IRepository<EncounterNote, long> encounterNoteRepository,
        IRepository<VitalSigns, long> vitalSignsRepository,
        IRepository<PatientAccessGrant, long> patientAccessGrantRepository,
        IRepository<PatientAccessAudit, long> patientAccessAuditRepository,
        UserManager userManager)
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

    /// <inheritdoc />
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

    /// <inheritdoc />
    public async Task<PatientTimelineDto> GetMyTimeline()
    {
        var patient = await EnsureCurrentPatientAsync();
        return await BuildTimelineAsync(patient.Id, isClinicianView: false);
    }

    private async Task<PatientTimelineDto> BuildTimelineAsync(long patientUserId, bool isClinicianView)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var patient = await _userRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.Id == patientUserId &&
            !item.IsDeleted);
        if (patient == null)
        {
            throw new UserFriendlyException("Patient record was not found.");
        }

        var visits = await _visitRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.PatientUserId == patientUserId && !item.IsDeleted)
            .OrderByDescending(item => item.VisitDate)
            .ToListAsync();

        var visitIds = visits.Select(item => item.Id).ToList();
        var facilityIds = visits.Where(item => item.FacilityId.HasValue).Select(item => item.FacilityId!.Value).Distinct().ToList();

        var facilities = facilityIds.Count == 0
            ? new Dictionary<int, Facility>()
            : await _facilityRepository.GetAll()
                .Where(item => item.TenantId == tenantId && facilityIds.Contains(item.Id) && !item.IsDeleted)
                .ToDictionaryAsync(item => item.Id);

        var intakes = await LoadSymptomIntakesAsync(tenantId, visitIds);
        var triageAssessments = await LoadTriageAssessmentsAsync(tenantId, visitIds);
        var encounterNotes = await LoadEncounterNotesAsync(tenantId, visitIds);
        var queueTickets = await _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .OrderByDescending(item => item.LastStatusChangedAt)
            .ToListAsync();
        var latestQueueTickets = queueTickets
            .GroupBy(item => item.VisitId)
            .ToDictionary(group => group.Key, group => group.First());
        var latestVitals = await _vitalSignsRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .OrderByDescending(item => item.RecordedAt)
            .ToListAsync();
        var vitalsByVisit = latestVitals
            .GroupBy(item => item.VisitId)
            .ToDictionary(group => group.Key, group => group.First());

        var queueEventLookup = await LoadQueueEventsAsync(tenantId, queueTickets.Select(item => item.Id).Distinct().ToList());
        var userLookup = await BuildUserLookupAsync(
            visits.Select(item => item.AssignedClinicianUserId)
                .Concat(latestQueueTickets.Values.Select(item => item.CurrentClinicianUserId))
                .Concat(latestQueueTickets.Values.Select(item => item.ConsultationStartedByClinicianUserId))
                .Concat(vitalsByVisit.Values.Select(item => (long?)item.RecordedByClinicianUserId))
                .Concat(encounterNotes.Values.Select(item => (long?)item.CreatedByClinicianUserId))
                .Concat(queueEventLookup.Values.SelectMany(item => item).Select(item => item.ChangedByClinicianUserId))
                .Where(item => item.HasValue)
                .Select(item => item!.Value)
                .Distinct()
                .ToList());

        var visitDtos = visits.Select(visit =>
        {
            intakes.TryGetValue(visit.Id, out var intake);
            triageAssessments.TryGetValue(visit.Id, out var triage);
            latestQueueTickets.TryGetValue(visit.Id, out var queueTicket);
            encounterNotes.TryGetValue(visit.Id, out var note);
            var summary = BuildVisitSummary(note, intake, isClinicianView);

            return new PatientTimelineVisitDto
            {
                VisitId = visit.Id,
                VisitDate = visit.VisitDate,
                VisitStatus = visit.Status ?? string.Empty,
                FacilityId = visit.FacilityId,
                FacilityName = ResolveFacilityName(visit.FacilityId, facilities),
                Title = DetermineVisitTitle(note, triage),
                ChiefComplaint = intake?.FreeTextComplaint ?? string.Empty,
                Summary = summary.Text,
                SummarySource = summary.Source,
                UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null,
                QueueStatus = queueTicket?.QueueStatus,
                ClinicianName = ResolveUserName(visit.AssignedClinicianUserId, userLookup),
                FinalizedAt = note?.FinalizedAt
            };
        }).ToList();

        var timelineEvents = BuildTimelineEvents(
            visits,
            intakes,
            triageAssessments,
            latestQueueTickets,
            queueEventLookup,
            encounterNotes,
            vitalsByVisit,
            facilities,
            userLookup,
            isClinicianView);

        return new PatientTimelineDto
        {
            IsClinicianView = isClinicianView,
            Patient = new PatientTimelinePatientDto
            {
                PatientUserId = patient.Id,
                PatientName = BuildFullName(patient),
                DateOfBirth = patient.DateOfBirth,
                IdNumber = isClinicianView ? patient.IdNumber : null,
                TotalVisits = visits.Count,
                MostRecentVisitAt = visits.FirstOrDefault()?.VisitDate
            },
            Visits = visitDtos,
            Timeline = timelineEvents,
            Conditions = new List<PatientTimelineRecordDto>(),
            Allergies = new List<PatientTimelineRecordDto>(),
            Medications = new List<PatientTimelineRecordDto>()
        };
    }

    private async Task<HistoryAccessContext> EnsureClinicianCanViewTimelineAsync(long patientUserId, User clinician)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var assignedVisitId = await _visitRepository.GetAll()
            .Where(item =>
                item.TenantId == tenantId &&
                item.PatientUserId == patientUserId &&
                item.AssignedClinicianUserId == clinician.Id &&
                !item.IsDeleted)
            .OrderByDescending(item => item.VisitDate)
            .Select(item => (long?)item.Id)
            .FirstOrDefaultAsync();
        if (assignedVisitId.HasValue)
        {
            return new HistoryAccessContext(PatientAccessConstants.AccessReasonAssignedVisit, assignedVisitId.Value);
        }

        var activeGrant = await _patientAccessGrantRepository.GetAll()
            .Where(item =>
                item.TenantId == tenantId &&
                item.PatientUserId == patientUserId &&
                item.ClinicianUserId == clinician.Id &&
                item.IsActive &&
                !item.IsDeleted)
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

    private static string DetermineVisitTitle(EncounterNote? note, TriageAssessment? triage)
    {
        if (note != null)
        {
            return string.Equals(note.Status, PatientIntakeConstants.EncounterNoteStatusFinalized, StringComparison.OrdinalIgnoreCase)
                ? "Consultation"
                : "Consultation Draft";
        }

        return triage != null ? "Triage Assessment" : "Visit";
    }

    private static (string Text, string Source) BuildVisitSummary(EncounterNote? note, SymptomIntake? intake, bool isClinicianView)
    {
        if (note != null)
        {
            var preferred = isClinicianView ? note.ClinicianTimelineSummary : note.PatientTimelineSummary;
            if (!string.IsNullOrWhiteSpace(preferred))
            {
                return (NormalizeSentence(preferred), "finalized_summary");
            }
        }

        var fallbackParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(intake?.FreeTextComplaint))
        {
            fallbackParts.Add($"Reason for visit: {NormalizeSentence(intake.FreeTextComplaint)}");
        }

        if (note != null)
        {
            if (!string.IsNullOrWhiteSpace(note.Assessment))
            {
                fallbackParts.Add($"Assessment: {NormalizeSentence(note.Assessment)}");
            }

            if (!string.IsNullOrWhiteSpace(note.Plan))
            {
                fallbackParts.Add($"Plan: {NormalizeSentence(note.Plan)}");
            }

            if (!isClinicianView && fallbackParts.Count == 0 && !string.IsNullOrWhiteSpace(note.Subjective))
            {
                fallbackParts.Add(NormalizeSentence(note.Subjective));
            }
        }

        if (fallbackParts.Count == 0 && !string.IsNullOrWhiteSpace(intake?.SubjectiveSummary))
        {
            fallbackParts.Add(NormalizeSentence(intake.SubjectiveSummary));
        }

        return (string.Join(" ", fallbackParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim(), "derived_fallback");
    }

    private static List<PatientTimelineEventDto> BuildTimelineEvents(
        IReadOnlyList<Visit> visits,
        IReadOnlyDictionary<long, SymptomIntake> intakes,
        IReadOnlyDictionary<long, TriageAssessment> triageAssessments,
        IReadOnlyDictionary<long, QueueTicket> latestQueueTickets,
        IReadOnlyDictionary<long, List<QueueEvent>> queueEventLookup,
        IReadOnlyDictionary<long, EncounterNote> encounterNotes,
        IReadOnlyDictionary<long, VitalSigns> vitalsByVisit,
        IReadOnlyDictionary<int, Facility> facilities,
        IReadOnlyDictionary<long, User> userLookup,
        bool isClinicianView)
    {
        var events = new List<PatientTimelineEventDto>();

        foreach (var visit in visits)
        {
            intakes.TryGetValue(visit.Id, out var intake);
            triageAssessments.TryGetValue(visit.Id, out var triage);
            latestQueueTickets.TryGetValue(visit.Id, out var queueTicket);
            encounterNotes.TryGetValue(visit.Id, out var note);
            vitalsByVisit.TryGetValue(visit.Id, out var vitals);
            var facilityName = ResolveFacilityName(visit.FacilityId, facilities);

            if (queueTicket != null)
            {
                events.Add(new PatientTimelineEventDto
                {
                    EventId = $"queue-entered-{queueTicket.Id}",
                    VisitId = visit.Id,
                    EventType = "queue_entered",
                    Title = "Entered Queue",
                    Summary = $"Queue number {queueTicket.QueueNumber} at {facilityName}.",
                    OccurredAt = queueTicket.EnteredQueueAt,
                    FacilityId = visit.FacilityId,
                    FacilityName = facilityName,
                    Status = queueTicket.QueueStatus,
                    RecordedByName = null,
                    Provenance = "Queue ticket",
                    UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null
                });

                if (queueEventLookup.TryGetValue(queueTicket.Id, out var queueEvents))
                {
                    events.AddRange(queueEvents.Select(queueEvent => new PatientTimelineEventDto
                    {
                        EventId = $"queue-event-{queueEvent.Id}",
                        VisitId = visit.Id,
                        EventType = "queue_status",
                        Title = "Queue Update",
                        Summary = string.IsNullOrWhiteSpace(queueEvent.Notes)
                            ? $"Queue moved to {HumanizeStatus(queueEvent.NewStatus)}."
                            : NormalizeSentence(queueEvent.Notes),
                        OccurredAt = queueEvent.EventAt,
                        FacilityId = visit.FacilityId,
                        FacilityName = facilityName,
                        Status = queueEvent.NewStatus ?? string.Empty,
                        RecordedByName = ResolveUserName(queueEvent.ChangedByClinicianUserId, userLookup),
                        Provenance = "Queue event",
                        UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null
                    }));
                }
            }

            if (triage != null)
            {
                events.Add(new PatientTimelineEventDto
                {
                    EventId = $"triage-{triage.Id}",
                    VisitId = visit.Id,
                    EventType = "triage_assessment",
                    Title = "Triage Assessment",
                    Summary = isClinicianView
                        ? NormalizeSentence($"{triage.UrgencyLevel}. {triage.Explanation}")
                        : NormalizeSentence(triage.QueueMessage),
                    OccurredAt = triage.AssessedAt,
                    FacilityId = visit.FacilityId,
                    FacilityName = facilityName,
                    Status = triage.UrgencyLevel ?? string.Empty,
                    RecordedByName = null,
                    Provenance = "Triage assessment",
                    UrgencyLevel = isClinicianView ? triage.UrgencyLevel : null
                });
            }

            if (vitals != null)
            {
                events.Add(new PatientTimelineEventDto
                {
                    EventId = $"vitals-{vitals.Id}",
                    VisitId = visit.Id,
                    EventType = "vitals_recorded",
                    Title = "Vitals Recorded",
                    Summary = BuildVitalsSummary(vitals),
                    OccurredAt = vitals.RecordedAt,
                    FacilityId = visit.FacilityId,
                    FacilityName = facilityName,
                    Status = vitals.Phase ?? string.Empty,
                    RecordedByName = ResolveUserName(vitals.RecordedByClinicianUserId, userLookup),
                    Provenance = "Vital signs",
                    UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null
                });
            }

            if (note != null)
            {
                var summary = BuildVisitSummary(note, intake, isClinicianView);
                events.Add(new PatientTimelineEventDto
                {
                    EventId = $"consultation-{note.Id}",
                    VisitId = visit.Id,
                    EventType = "consultation",
                    Title = "Consultation",
                    Summary = summary.Text,
                    OccurredAt = note.FinalizedAt ?? note.LastModificationTime ?? note.CreationTime,
                    FacilityId = visit.FacilityId,
                    FacilityName = facilityName,
                    Status = note.Status ?? string.Empty,
                    RecordedByName = ResolveUserName(note.CreatedByClinicianUserId, userLookup),
                    Provenance = summary.Source == "finalized_summary" ? "Finalized encounter note" : "Derived encounter note summary",
                    UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null
                });
            }
        }

        return events
            .OrderByDescending(item => item.OccurredAt)
            .ThenByDescending(item => item.VisitId)
            .ToList();
    }

    private static string BuildVitalsSummary(VitalSigns vitals)
    {
        var parts = new List<string>();
        if (vitals.BloodPressureSystolic.HasValue || vitals.BloodPressureDiastolic.HasValue)
        {
            parts.Add($"BP {vitals.BloodPressureSystolic?.ToString(CultureInfo.InvariantCulture) ?? "?"}/{vitals.BloodPressureDiastolic?.ToString(CultureInfo.InvariantCulture) ?? "?"}");
        }

        if (vitals.HeartRate.HasValue)
        {
            parts.Add($"HR {vitals.HeartRate.Value}");
        }

        if (vitals.RespiratoryRate.HasValue)
        {
            parts.Add($"RR {vitals.RespiratoryRate.Value}");
        }

        if (vitals.TemperatureCelsius.HasValue)
        {
            parts.Add($"Temp {vitals.TemperatureCelsius.Value.ToString("0.0", CultureInfo.InvariantCulture)} C");
        }

        if (vitals.OxygenSaturation.HasValue)
        {
            parts.Add($"SpO2 {vitals.OxygenSaturation.Value}%");
        }

        return parts.Count == 0 ? "Vitals recorded." : string.Join(", ", parts);
    }

    private static string NormalizeSentence(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return string.Empty;
        }

        var flattened = trimmed.Replace("\r", " ").Replace("\n", " ").Trim();
        return flattened.EndsWith(".") || flattened.EndsWith("!") || flattened.EndsWith("?")
            ? flattened
            : $"{flattened}.";
    }

    private static string HumanizeStatus(string? status)
    {
        return string.IsNullOrWhiteSpace(status)
            ? string.Empty
            : status.Replace("_", " ");
    }

    private static string ResolveFacilityName(int? facilityId, IReadOnlyDictionary<int, Facility> facilities)
    {
        return facilityId.HasValue && facilities.TryGetValue(facilityId.Value, out var facility)
            ? facility.Name
            : "Unknown facility";
    }

    private static string? ResolveUserName(long? userId, IReadOnlyDictionary<long, User> userLookup)
    {
        if (!userId.HasValue || !userLookup.TryGetValue(userId.Value, out var user))
        {
            return null;
        }

        return BuildFullName(user);
    }

    private static string BuildFullName(User user)
    {
        return string.Concat(user.Name, " ", user.Surname).Trim();
    }

    private async Task<Dictionary<long, User>> BuildUserLookupAsync(List<long> userIds)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, User>();
        }

        var tenantId = AbpSession.TenantId ?? 1;
        return await _userRepository.GetAll()
            .Where(item => item.TenantId == tenantId && userIds.Contains(item.Id) && !item.IsDeleted)
            .ToDictionaryAsync(item => item.Id);
    }

    private async Task<Dictionary<long, List<QueueEvent>>> LoadQueueEventsAsync(int tenantId, List<long> queueTicketIds)
    {
        if (queueTicketIds.Count == 0)
        {
            return new Dictionary<long, List<QueueEvent>>();
        }

        var events = await _queueEventRepository.GetAll()
            .Where(item => item.TenantId == tenantId && queueTicketIds.Contains(item.QueueTicketId) && !item.IsDeleted)
            .OrderBy(item => item.EventAt)
            .ToListAsync();

        return events
            .GroupBy(item => item.QueueTicketId)
            .ToDictionary(group => group.Key, group => group.ToList());
    }

    private async Task<Dictionary<long, SymptomIntake>> LoadSymptomIntakesAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0)
        {
            return new Dictionary<long, SymptomIntake>();
        }

        var items = await _symptomIntakeRepository.GetAll()
            .Where(item => item.TenantId == tenantId && !item.IsDeleted)
            .Where(item => visitIds.Contains(item.VisitId))
            .OrderByDescending(item => item.SubmittedAt)
            .ToListAsync();

        return items
            .GroupBy(item => item.VisitId)
            .ToDictionary(group => group.Key, group => group.First());
    }

    private async Task<Dictionary<long, TriageAssessment>> LoadTriageAssessmentsAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0)
        {
            return new Dictionary<long, TriageAssessment>();
        }

        var items = await _triageAssessmentRepository.GetAll()
            .Where(item => item.TenantId == tenantId && !item.IsDeleted)
            .Where(item => visitIds.Contains(item.VisitId))
            .OrderByDescending(item => item.AssessedAt)
            .ToListAsync();

        return items
            .GroupBy(item => item.VisitId)
            .ToDictionary(group => group.Key, group => group.First());
    }

    private async Task<Dictionary<long, EncounterNote>> LoadEncounterNotesAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0)
        {
            return new Dictionary<long, EncounterNote>();
        }

        var items = await _encounterNoteRepository.GetAll()
            .Where(item => item.TenantId == tenantId && !item.IsDeleted)
            .Where(item => visitIds.Contains(item.VisitId))
            .OrderByDescending(item => item.FinalizedAt ?? item.LastModificationTime ?? item.CreationTime)
            .ToListAsync();

        return items
            .GroupBy(item => item.VisitId)
            .ToDictionary(group => group.Key, group => group.First());
    }

    private readonly record struct HistoryAccessContext(string AccessReason, long? VisitId);
}
