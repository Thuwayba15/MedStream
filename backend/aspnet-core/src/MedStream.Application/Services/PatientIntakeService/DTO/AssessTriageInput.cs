using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Input payload for triage assessment.
/// </summary>
public class AssessTriageInput
{
    /// <summary>
    /// Gets or sets visit id.
    /// </summary>
    [Required]
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets free-text complaint.
    /// </summary>
    [StringLength(4000)]
    public string FreeText { get; set; }

    /// <summary>
    /// Gets or sets selected symptom chips.
    /// </summary>
    public List<string> SelectedSymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extracted primary symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets dynamic question answers keyed by question key.
    /// </summary>
    public Dictionary<string, object> Answers { get; set; } = new();

    /// <summary>
    /// Gets or sets clinician objective observations keyed by input id.
    /// </summary>
    public Dictionary<string, object> Observations { get; set; } = new();

    /// <summary>
    /// Gets or sets follow-up plans completed before final triage submission.
    /// </summary>
    public List<AssessTriageFollowUpPlanInput> FollowUpPlans { get; set; } = new();

    /// <summary>
    /// Gets or sets follow-up question metadata to support merged triage.
    /// </summary>
    public List<AssessTriageFollowUpQuestionInput> FollowUpQuestions { get; set; } = new();
}

/// <summary>
/// Follow-up plan metadata included with final triage submission.
/// </summary>
public class AssessTriageFollowUpPlanInput
{
    /// <summary>
    /// Gets or sets pathway key represented by the page.
    /// </summary>
    public string PathwayKey { get; set; }

    /// <summary>
    /// Gets or sets primary symptom focus for the page.
    /// </summary>
    public string PrimarySymptom { get; set; }

    /// <summary>
    /// Gets or sets intake mode for the page.
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets APC fallback summary ids associated with the page.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();
}

/// <summary>
/// Follow-up question metadata submitted with triage to support deterministic fallback scoring.
/// </summary>
public class AssessTriageFollowUpQuestionInput
{
    /// <summary>
    /// Gets or sets owning plan key.
    /// </summary>
    public string PlanKey { get; set; }

    /// <summary>
    /// Gets or sets pathway key for the question page.
    /// </summary>
    public string PathwayKey { get; set; }

    /// <summary>
    /// Gets or sets intake mode for the question page.
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets question key.
    /// </summary>
    public string QuestionKey { get; set; }

    /// <summary>
    /// Gets or sets displayed question text.
    /// </summary>
    public string QuestionText { get; set; }

    /// <summary>
    /// Gets or sets input type.
    /// </summary>
    public string InputType { get; set; }
}
