#nullable enable
using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Consultation;

public partial class ConsultationAppService
{
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

    private async Task<SymptomIntake?> GetSymptomIntakeAsync(Visit visit)
    {
        return await _symptomIntakeRepository.FirstOrDefaultAsync(item => item.TenantId == visit.TenantId && item.VisitId == visit.Id && !item.IsDeleted);
    }

    private async Task<TriageAssessment?> GetTriageAssessmentAsync(long visitId, int tenantId)
    {
        return await _triageAssessmentRepository.FirstOrDefaultAsync(item => item.TenantId == tenantId && item.VisitId == visitId && !item.IsDeleted);
    }

    private async Task<QueueTicket?> GetLatestQueueTicketAsync(long visitId, int tenantId, long? queueTicketId)
    {
        var query = _queueTicketRepository.GetAll().Where(item => item.TenantId == tenantId && item.VisitId == visitId && !item.IsDeleted);
        if (queueTicketId.HasValue)
        {
            query = query.Where(item => item.Id == queueTicketId.Value);
        }

        return await query.OrderByDescending(item => item.LastStatusChangedAt).FirstOrDefaultAsync();
    }

    private async Task<EncounterNote> GetOrCreateEncounterNoteAsync(Visit visit, SymptomIntake? intake, long clinicianUserId)
    {
        var note = await _encounterNoteRepository.FirstOrDefaultAsync(item => item.TenantId == visit.TenantId && item.VisitId == visit.Id && !item.IsDeleted);
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
}
