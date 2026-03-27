using Abp.Application.Services;
using MedStream.PatientIntake.Dto;
using System.Threading.Tasks;

namespace MedStream.PatientIntake;

/// <summary>
/// Application service contract for patient intake workflow.
/// </summary>
public interface IPatientIntakeAppService : IApplicationService
{
    /// <summary>
    /// Starts a patient check-in session and creates a visit context.
    /// </summary>
    Task<PatientCheckInOutput> CheckIn();

    /// <summary>
    /// Captures free-text symptoms and selected symptom chips.
    /// </summary>
    Task<CaptureSymptomsOutput> CaptureSymptoms(CaptureSymptomsInput input);

    /// <summary>
    /// Extracts primary symptoms using OpenAI when available with deterministic fallback.
    /// </summary>
    Task<ExtractSymptomsOutput> ExtractSymptoms(ExtractSymptomsInput input);

    /// <summary>
    /// Returns dynamic follow-up questions for the selected pathway.
    /// </summary>
    Task<GetIntakeQuestionsOutput> GetQuestions(GetIntakeQuestionsInput input);

    /// <summary>
    /// Computes triage output and queue placeholder status.
    /// </summary>
    Task<AssessTriageOutput> AssessTriage(AssessTriageInput input);
}
