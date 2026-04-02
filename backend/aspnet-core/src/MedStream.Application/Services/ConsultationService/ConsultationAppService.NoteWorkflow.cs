#nullable enable
using Abp.UI;
using MedStream.Consultation.Dto;
using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Consultation;

public partial class ConsultationAppService
{
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

        if (input.Subjective != null) note.Subjective = SanitizeSection(input.Subjective);
        if (input.Objective != null) note.Objective = SanitizeSection(input.Objective);
        if (input.Assessment != null) note.Assessment = SanitizeSection(input.Assessment);
        if (input.Plan != null) note.Plan = SanitizeSection(input.Plan);
        if (input.ClinicianTimelineSummary != null) note.ClinicianTimelineSummary = SanitizeTimelineSummary(input.ClinicianTimelineSummary);
        if (input.PatientTimelineSummary != null) note.PatientTimelineSummary = SanitizeTimelineSummary(input.PatientTimelineSummary);

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

        if (string.IsNullOrWhiteSpace(note.Subjective)) throw new UserFriendlyException("Subjective must be completed before finalizing the note.");
        if (string.IsNullOrWhiteSpace(note.Objective) && latestVitals == null) throw new UserFriendlyException("Add objective findings or save consultation vitals before finalizing the note.");
        if (string.IsNullOrWhiteSpace(note.Assessment)) throw new UserFriendlyException("Assessment must be completed before finalizing the note.");
        if (string.IsNullOrWhiteSpace(note.Plan)) throw new UserFriendlyException("Plan must be completed before finalizing the note.");

        note.ClinicianTimelineSummary = SanitizeTimelineSummary(input.ClinicianTimelineSummary);
        note.PatientTimelineSummary = SanitizeTimelineSummary(input.PatientTimelineSummary);

        if (string.IsNullOrWhiteSpace(note.ClinicianTimelineSummary)) throw new UserFriendlyException("Clinician timeline summary must be completed before finalizing the note.");
        if (string.IsNullOrWhiteSpace(note.PatientTimelineSummary)) throw new UserFriendlyException("Patient timeline summary must be completed before finalizing the note.");

        note.Status = PatientIntakeConstants.EncounterNoteStatusFinalized;
        note.FinalizedAt = DateTime.UtcNow;
        await _encounterNoteRepository.UpdateAsync(note);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapEncounterNote(note);
    }
}
