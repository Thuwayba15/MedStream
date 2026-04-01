using Abp.Application.Services;
using MedStream.PatientTimeline.Dto;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace MedStream.PatientTimeline;

/// <summary>
/// Read-only longitudinal patient history across visits and facilities.
/// </summary>
public interface IPatientTimelineAppService : IApplicationService
{
    /// <summary>
    /// Returns patient timeline data for an authorized clinician.
    /// </summary>
    Task<PatientTimelineDto> GetPatientTimeline(GetPatientTimelineInput input);

    /// <summary>
    /// Returns self-history for the currently signed-in patient.
    /// </summary>
    [HttpGet]
    Task<PatientTimelineDto> GetMyTimeline();
}
