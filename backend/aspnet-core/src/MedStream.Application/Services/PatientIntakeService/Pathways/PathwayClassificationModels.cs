using System.Collections.Generic;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Normalized complaint text payload used for deterministic pathway classification.
/// </summary>
public class NormalizedComplaintText
{
    /// <summary>
    /// Gets or sets canonical normalized complaint text.
    /// </summary>
    public string NormalizedText { get; set; }

    /// <summary>
    /// Gets or sets tokenized normalized text.
    /// </summary>
    public HashSet<string> Tokens { get; set; } = new();
}

/// <summary>
/// Classification confidence levels for complaint routing.
/// </summary>
public enum ClassificationConfidenceBand
{
    /// <summary>
    /// Low confidence.
    /// </summary>
    Low = 0,

    /// <summary>
    /// Medium confidence.
    /// </summary>
    Medium = 1,

    /// <summary>
    /// High confidence.
    /// </summary>
    High = 2
}

/// <summary>
/// Signal-level explanation for candidate pathway scoring.
/// </summary>
public class PathwayClassificationSignal
{
    /// <summary>
    /// Gets or sets signal type.
    /// </summary>
    public string SignalType { get; set; }

    /// <summary>
    /// Gets or sets matched term or phrase.
    /// </summary>
    public string MatchedTerm { get; set; }

    /// <summary>
    /// Gets or sets signal score contribution.
    /// </summary>
    public decimal Weight { get; set; }
}

/// <summary>
/// Ranked pathway candidate output for deterministic classification.
/// </summary>
public class PathwayClassificationCandidate
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
    /// Gets or sets confidence band for this candidate in current ranking context.
    /// </summary>
    public ClassificationConfidenceBand ConfidenceBand { get; set; }

    /// <summary>
    /// Gets or sets signal breakdown for explainability.
    /// </summary>
    public List<PathwayClassificationSignal> MatchedSignals { get; set; } = new();
}

/// <summary>
/// Deterministic pathway classification result.
/// </summary>
public class PathwayClassificationResult
{
    /// <summary>
    /// Gets or sets normalized complaint text.
    /// </summary>
    public string NormalizedComplaintText { get; set; }

    /// <summary>
    /// Gets or sets ranked entry-pathway candidates.
    /// </summary>
    public List<PathwayClassificationCandidate> Candidates { get; set; } = new();

    /// <summary>
    /// Gets or sets selected primary pathway id.
    /// </summary>
    public string SelectedPathwayId { get; set; }

    /// <summary>
    /// Gets or sets ordered likely pathway ids.
    /// </summary>
    public List<string> LikelyPathwayIds { get; set; } = new();

    /// <summary>
    /// Gets or sets whether disambiguation should be asked.
    /// </summary>
    public bool ShouldAskDisambiguation { get; set; }

    /// <summary>
    /// Gets or sets optional disambiguation prompt.
    /// </summary>
    public string DisambiguationPrompt { get; set; }

    /// <summary>
    /// Gets or sets top-level confidence.
    /// </summary>
    public ClassificationConfidenceBand ConfidenceBand { get; set; }
}
