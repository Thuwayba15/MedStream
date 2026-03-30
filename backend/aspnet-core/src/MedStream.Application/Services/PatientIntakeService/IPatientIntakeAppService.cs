using Abp.Application.Services;
using MedStream.PatientIntake.Dto;
using Microsoft.AspNetCore.Mvc;
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
    /// Extracts primary symptoms and selects intake mode using deterministic pathway routing first.
    /// </summary>
    Task<ExtractSymptomsOutput> ExtractSymptoms(ExtractSymptomsInput input);

    /// <summary>
    /// Returns dynamic follow-up questions for the selected pathway.
    /// </summary>
    [HttpPost]
    Task<GetIntakeQuestionsOutput> GetQuestions(GetIntakeQuestionsInput input);

    /// <summary>
    /// Returns dynamic follow-up questions for the selected pathway using explicit load endpoint naming.
    /// </summary>
    [HttpPost]
    Task<GetIntakeQuestionsOutput> LoadQuestions(GetIntakeQuestionsInput input);

    /// <summary>
    /// Runs early urgent-check questions and urgent signal evaluation.
    /// </summary>
    Task<UrgentCheckOutput> UrgentCheck(UrgentCheckInput input);

    /// <summary>
    /// Computes triage output and ensures persistent queue ticket creation.
    /// </summary>
    Task<AssessTriageOutput> AssessTriage(AssessTriageInput input);
}
