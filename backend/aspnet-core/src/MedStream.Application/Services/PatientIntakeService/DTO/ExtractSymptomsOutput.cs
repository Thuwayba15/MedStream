using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload for extracted primary symptoms.
/// </summary>
public class ExtractSymptomsOutput
{
    /// <summary>
    /// Gets or sets top extracted symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extraction source metadata.
    /// </summary>
    public string ExtractionSource { get; set; }

    /// <summary>
    /// Gets or sets ranked likely pathway ids.
    /// </summary>
    public List<string> LikelyPathwayIds { get; set; } = new();

    /// <summary>
    /// Gets or sets ranked deterministic classification candidates.
    /// </summary>
    public List<PathwayClassificationCandidateDto> Candidates { get; set; } = new();

    /// <summary>
    /// Gets or sets selected pathway id used for next question retrieval.
    /// </summary>
    public string SelectedPathwayKey { get; set; }

    /// <summary>
    /// Gets or sets intake mode selected after deterministic routing.
    /// approved_json uses approved JSON pathway questions;
    /// apc_fallback uses APC summary-backed temporary subjective questions.
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets overall classification confidence.
    /// </summary>
    public string ConfidenceBand { get; set; }

    /// <summary>
    /// Gets or sets whether the flow should ask user disambiguation.
    /// </summary>
    public bool ShouldAskDisambiguation { get; set; }

    /// <summary>
    /// Gets or sets disambiguation prompt for low-confidence routing.
    /// </summary>
    public string DisambiguationPrompt { get; set; }

    /// <summary>
    /// Gets or sets selected APC catalog section ids used for fallback retrieval.
    /// </summary>
    public List<string> FallbackSectionIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected APC summary ids used to generate fallback questions.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets mapped input values inferred from free-text intake.
    /// </summary>
    public Dictionary<string, object> MappedInputValues { get; set; } = new();

    /// <summary>
    /// Gets or sets ordered follow-up plans shown to the patient.
    /// </summary>
    public List<FollowUpPlanDto> FollowUpPlans { get; set; } = new();
}

/// <summary>
/// Ranked pathway classification candidate DTO.
/// </summary>
public class PathwayClassificationCandidateDto
{
    /// <summary>
    /// Gets or sets pathway id.
    /// </summary>
    public string PathwayId { get; set; }

    /// <summary>
    /// Gets or sets total score.
    /// </summary>
    public decimal TotalScore { get; set; }

    /// <summary>
    /// Gets or sets confidence for this candidate.
    /// </summary>
    public string ConfidenceBand { get; set; }

    /// <summary>
    /// Gets or sets signal explanation list.
    /// </summary>
    public List<PathwayClassificationSignalDto> MatchedSignals { get; set; } = new();
}

/// <summary>
/// Signal-level deterministic classification explanation DTO.
/// </summary>
public class PathwayClassificationSignalDto
{
    /// <summary>
    /// Gets or sets signal type.
    /// </summary>
    public string SignalType { get; set; }

    /// <summary>
    /// Gets or sets matched phrase/token.
    /// </summary>
    public string MatchedTerm { get; set; }

    /// <summary>
    /// Gets or sets signal weight contribution.
    /// </summary>
    public decimal Weight { get; set; }
}

/// <summary>
/// Follow-up plan DTO describing one patient follow-up page.
/// </summary>
public class FollowUpPlanDto
{
    /// <summary>
    /// Gets or sets stable plan key.
    /// </summary>
    public string PlanKey { get; set; }

    /// <summary>
    /// Gets or sets page title shown in the patient flow.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// Gets or sets pathway key used to load questions.
    /// </summary>
    public string PathwayKey { get; set; }

    /// <summary>
    /// Gets or sets symptom focus for this page.
    /// </summary>
    public string PrimarySymptom { get; set; }

    /// <summary>
    /// Gets or sets intake mode for the page.
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets APC fallback summary ids when needed.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();
}
