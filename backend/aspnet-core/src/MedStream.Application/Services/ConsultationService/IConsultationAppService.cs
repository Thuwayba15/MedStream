using Abp.Application.Services;
using MedStream.Consultation.Dto;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace MedStream.Consultation;

/// <summary>
/// Clinician-facing consultation workflow for visit-scoped vitals, SOAP drafting, transcripts, and finalization.
/// </summary>
public interface IConsultationAppService : IApplicationService
{
    Task<ConsultationWorkspaceDto> GetConsultationWorkspace(GetConsultationWorkspaceInput input);

    [HttpPost]
    Task<ConsultationVitalSignsDto> SaveVitals(SaveVitalsInput input);

    [HttpPost]
    Task<EncounterNoteDto> SaveEncounterNoteDraft(SaveEncounterNoteDraftInput input);

    [HttpPost]
    Task<ConsultationTranscriptDto> AttachConsultationTranscript(AttachConsultationTranscriptInput input);

    [HttpPost]
    Task<ConsultationAiDraftDto> GenerateSubjectiveDraft(GenerateConsultationDraftInput input);

    [HttpPost]
    Task<ConsultationAiDraftDto> GenerateAssessmentPlanDraft(GenerateConsultationDraftInput input);

    [HttpPost]
    Task<EncounterNoteDto> FinalizeEncounterNote(FinalizeEncounterNoteInput input);
}
