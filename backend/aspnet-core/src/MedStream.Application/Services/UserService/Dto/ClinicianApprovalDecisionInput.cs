using Abp.Application.Services.Dto;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Users.Dto;

/// <summary>
/// Input for clinician approval and decline decisions.
/// </summary>
public class ClinicianApprovalDecisionInput : EntityDto<long>
{
    /// <summary>
    /// Gets or sets the admin's reason for the decision.
    /// </summary>
    [Required]
    [StringLength(512, MinimumLength = 3)]
    public string DecisionReason { get; set; }
}
