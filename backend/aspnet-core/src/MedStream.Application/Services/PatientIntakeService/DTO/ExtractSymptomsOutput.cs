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
    /// Gets or sets mapped input values inferred from free-text intake.
    /// </summary>
    public Dictionary<string, object> MappedInputValues { get; set; } = new();
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
