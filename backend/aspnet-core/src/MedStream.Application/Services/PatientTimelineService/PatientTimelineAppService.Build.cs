#nullable enable
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.PatientIntake;
using MedStream.PatientTimeline.Dto;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientTimeline;

public partial class PatientTimelineAppService
{
    private async Task<PatientTimelineDto> BuildTimelineAsync(long patientUserId, bool isClinicianView)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var patient = await _userRepository.FirstOrDefaultAsync(item => item.TenantId == tenantId && item.Id == patientUserId && !item.IsDeleted);
        if (patient == null)
        {
            throw new Abp.UI.UserFriendlyException("Patient record was not found.");
        }

        var visits = await _visitRepository.GetAll()
            .Where(item => item.TenantId == tenantId && item.PatientUserId == patientUserId && !item.IsDeleted)
            .OrderByDescending(item => item.VisitDate)
            .ToListAsync();

        var visitIds = visits.Select(item => item.Id).ToList();
        var facilityIds = visits.Where(item => item.FacilityId.HasValue).Select(item => item.FacilityId!.Value).Distinct().ToList();
        var facilities = facilityIds.Count == 0 ? new Dictionary<int, Facility>() : await _facilityRepository.GetAll()
            .Where(item => item.TenantId == tenantId && facilityIds.Contains(item.Id) && !item.IsDeleted)
            .ToDictionaryAsync(item => item.Id);

        var intakes = await LoadSymptomIntakesAsync(tenantId, visitIds);
        var triageAssessments = await LoadTriageAssessmentsAsync(tenantId, visitIds);
        var encounterNotes = await LoadEncounterNotesAsync(tenantId, visitIds);
        var queueTickets = await _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .OrderByDescending(item => item.LastStatusChangedAt)
            .ToListAsync();
        var latestQueueTickets = queueTickets.GroupBy(item => item.VisitId).ToDictionary(group => group.Key, group => group.First());
        var latestVitals = await _vitalSignsRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .OrderByDescending(item => item.RecordedAt)
            .ToListAsync();
        var vitalsByVisit = latestVitals.GroupBy(item => item.VisitId).ToDictionary(group => group.Key, group => group.First());

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

        var timelineEvents = BuildTimelineEvents(visits, intakes, triageAssessments, latestQueueTickets, queueEventLookup, encounterNotes, vitalsByVisit, facilities, userLookup, isClinicianView);

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

    private async Task<Dictionary<long, User>> BuildUserLookupAsync(List<long> userIds)
    {
        if (userIds.Count == 0) return new Dictionary<long, User>();
        return await _userRepository.GetAll().Where(item => userIds.Contains(item.Id) && !item.IsDeleted).ToDictionaryAsync(item => item.Id);
    }

    private async Task<Dictionary<long, List<QueueEvent>>> LoadQueueEventsAsync(int tenantId, List<long> queueTicketIds)
    {
        if (queueTicketIds.Count == 0) return new Dictionary<long, List<QueueEvent>>();
        var events = await _queueEventRepository.GetAll()
            .Where(item => item.TenantId == tenantId && queueTicketIds.Contains(item.QueueTicketId) && !item.IsDeleted)
            .OrderByDescending(item => item.EventAt)
            .ToListAsync();
        return events.GroupBy(item => item.QueueTicketId).ToDictionary(group => group.Key, group => group.ToList());
    }

    private async Task<Dictionary<long, SymptomIntake>> LoadSymptomIntakesAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0) return new Dictionary<long, SymptomIntake>();
        return await _symptomIntakeRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .GroupBy(item => item.VisitId)
            .Select(group => group.OrderByDescending(item => item.SubmittedAt).First())
            .ToDictionaryAsync(item => item.VisitId);
    }

    private async Task<Dictionary<long, TriageAssessment>> LoadTriageAssessmentsAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0) return new Dictionary<long, TriageAssessment>();
        return await _triageAssessmentRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .GroupBy(item => item.VisitId)
            .Select(group => group.OrderByDescending(item => item.AssessedAt).First())
            .ToDictionaryAsync(item => item.VisitId);
    }

    private async Task<Dictionary<long, EncounterNote>> LoadEncounterNotesAsync(int tenantId, List<long> visitIds)
    {
        if (visitIds.Count == 0) return new Dictionary<long, EncounterNote>();
        return await _encounterNoteRepository.GetAll()
            .Where(item => item.TenantId == tenantId && visitIds.Contains(item.VisitId) && !item.IsDeleted)
            .GroupBy(item => item.VisitId)
            .Select(group => group.OrderByDescending(item => item.FinalizedAt ?? item.LastModificationTime ?? item.CreationTime).First())
            .ToDictionaryAsync(item => item.VisitId);
    }
}
