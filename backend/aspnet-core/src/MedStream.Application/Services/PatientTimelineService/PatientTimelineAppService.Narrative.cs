#nullable enable
using MedStream.Facilities;
using MedStream.PatientIntake;
using MedStream.PatientTimeline.Dto;
using MedStream.Authorization.Users;
using MedStream.Users;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace MedStream.PatientTimeline;

public partial class PatientTimelineAppService
{
    private static string DetermineVisitTitle(EncounterNote? note, TriageAssessment? triage)
    {
        if (note != null)
        {
            return string.Equals(note.Status, PatientIntakeConstants.EncounterNoteStatusFinalized, StringComparison.OrdinalIgnoreCase) ? "Consultation" : "Consultation Draft";
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
        if (!string.IsNullOrWhiteSpace(intake?.FreeTextComplaint)) fallbackParts.Add($"Reason for visit: {NormalizeSentence(intake.FreeTextComplaint)}");
        if (note != null)
        {
            if (!string.IsNullOrWhiteSpace(note.Assessment)) fallbackParts.Add($"Assessment: {NormalizeSentence(note.Assessment)}");
            if (!string.IsNullOrWhiteSpace(note.Plan)) fallbackParts.Add($"Plan: {NormalizeSentence(note.Plan)}");
            if (!isClinicianView && fallbackParts.Count == 0 && !string.IsNullOrWhiteSpace(note.Subjective)) fallbackParts.Add(NormalizeSentence(note.Subjective));
        }
        if (fallbackParts.Count == 0 && !string.IsNullOrWhiteSpace(intake?.SubjectiveSummary)) fallbackParts.Add(NormalizeSentence(intake.SubjectiveSummary));
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
                events.Add(new PatientTimelineEventDto { EventId = $"queue-entered-{queueTicket.Id}", VisitId = visit.Id, EventType = "queue_entered", Title = "Entered Queue", Summary = $"Queue number {queueTicket.QueueNumber} at {facilityName}.", OccurredAt = queueTicket.EnteredQueueAt, FacilityId = visit.FacilityId, FacilityName = facilityName, Status = queueTicket.QueueStatus, RecordedByName = null, Provenance = "Queue ticket", UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null });
                if (queueEventLookup.TryGetValue(queueTicket.Id, out var queueEvents))
                {
                    events.AddRange(queueEvents.Select(queueEvent => new PatientTimelineEventDto { EventId = $"queue-event-{queueEvent.Id}", VisitId = visit.Id, EventType = "queue_status", Title = "Queue Update", Summary = string.IsNullOrWhiteSpace(queueEvent.Notes) ? $"Queue moved to {HumanizeStatus(queueEvent.NewStatus)}." : NormalizeSentence(queueEvent.Notes), OccurredAt = queueEvent.EventAt, FacilityId = visit.FacilityId, FacilityName = facilityName, Status = queueEvent.NewStatus ?? string.Empty, RecordedByName = ResolveUserName(queueEvent.ChangedByClinicianUserId, userLookup), Provenance = "Queue event", UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null }));
                }
            }

            if (triage != null)
            {
                events.Add(new PatientTimelineEventDto { EventId = $"triage-{triage.Id}", VisitId = visit.Id, EventType = "triage_assessment", Title = "Triage Assessment", Summary = isClinicianView ? NormalizeSentence($"{triage.UrgencyLevel}. {triage.Explanation}") : NormalizeSentence(triage.QueueMessage), OccurredAt = triage.AssessedAt, FacilityId = visit.FacilityId, FacilityName = facilityName, Status = triage.UrgencyLevel ?? string.Empty, RecordedByName = null, Provenance = "Triage assessment", UrgencyLevel = isClinicianView ? triage.UrgencyLevel : null });
            }

            if (vitals != null)
            {
                events.Add(new PatientTimelineEventDto { EventId = $"vitals-{vitals.Id}", VisitId = visit.Id, EventType = "vitals_recorded", Title = "Vitals Recorded", Summary = BuildVitalsSummary(vitals), OccurredAt = vitals.RecordedAt, FacilityId = visit.FacilityId, FacilityName = facilityName, Status = vitals.Phase ?? string.Empty, RecordedByName = ResolveUserName(vitals.RecordedByClinicianUserId, userLookup), Provenance = "Vital signs", UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null });
            }

            if (note != null)
            {
                var summary = BuildVisitSummary(note, intake, isClinicianView);
                events.Add(new PatientTimelineEventDto { EventId = $"consultation-{note.Id}", VisitId = visit.Id, EventType = "consultation", Title = "Consultation", Summary = summary.Text, OccurredAt = note.FinalizedAt ?? note.LastModificationTime ?? note.CreationTime, FacilityId = visit.FacilityId, FacilityName = facilityName, Status = note.Status ?? string.Empty, RecordedByName = ResolveUserName(note.CreatedByClinicianUserId, userLookup), Provenance = summary.Source == "finalized_summary" ? "Finalized encounter note" : "Derived encounter note summary", UrgencyLevel = isClinicianView ? triage?.UrgencyLevel : null });
            }
        }

        return events.OrderByDescending(item => item.OccurredAt).ThenByDescending(item => item.VisitId).ToList();
    }

    private static string BuildVitalsSummary(VitalSigns vitals)
    {
        var parts = new List<string>();
        if (vitals.BloodPressureSystolic.HasValue || vitals.BloodPressureDiastolic.HasValue) parts.Add($"BP {vitals.BloodPressureSystolic?.ToString(CultureInfo.InvariantCulture) ?? "?"}/{vitals.BloodPressureDiastolic?.ToString(CultureInfo.InvariantCulture) ?? "?"}");
        if (vitals.HeartRate.HasValue) parts.Add($"HR {vitals.HeartRate.Value}");
        if (vitals.RespiratoryRate.HasValue) parts.Add($"RR {vitals.RespiratoryRate.Value}");
        if (vitals.TemperatureCelsius.HasValue) parts.Add($"Temp {vitals.TemperatureCelsius.Value.ToString("0.0", CultureInfo.InvariantCulture)} C");
        if (vitals.OxygenSaturation.HasValue) parts.Add($"SpO2 {vitals.OxygenSaturation.Value}%");
        if (vitals.BloodGlucose.HasValue) parts.Add($"Glucose {vitals.BloodGlucose.Value.ToString("0.##", CultureInfo.InvariantCulture)}");
        if (vitals.WeightKg.HasValue) parts.Add($"Weight {vitals.WeightKg.Value.ToString("0.##", CultureInfo.InvariantCulture)} kg");
        return string.Join(", ", parts);
    }

    private static string NormalizeSentence(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return text.EndsWith(".", StringComparison.Ordinal) ? text : $"{text}.";
    }

    private static string HumanizeStatus(string? status) => string.IsNullOrWhiteSpace(status) ? "updated" : status.Replace("_", " ", StringComparison.OrdinalIgnoreCase);
    private static string ResolveFacilityName(int? facilityId, IReadOnlyDictionary<int, Facility> facilities) => facilityId.HasValue && facilities.TryGetValue(facilityId.Value, out var facility) ? facility.Name : "Unknown facility";
    private static string? ResolveUserName(long? userId, IReadOnlyDictionary<long, User> userLookup) => userId.HasValue && userLookup.TryGetValue(userId.Value, out var user) ? BuildFullName(user) : null;
    private static string BuildFullName(User user) => string.Concat(user.Name, " ", user.Surname).Trim();
}
