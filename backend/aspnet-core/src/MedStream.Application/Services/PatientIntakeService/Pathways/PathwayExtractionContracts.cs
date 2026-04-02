using Abp.Dependency;
using MedStream.PatientIntake.Dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Extraction output used to drive pathway selection and input pre-mapping.
/// </summary>
public class PathwayExtractionResult
{
    /// <summary>
    /// Gets or sets extracted primary symptoms.
    /// </summary>
    public List<string> ExtractedPrimarySymptoms { get; set; } = new();

    /// <summary>
    /// Gets or sets extraction source.
    /// </summary>
    public string ExtractionSource { get; set; }

    /// <summary>
    /// Gets or sets likely pathway ids ranked by classifier.
    /// </summary>
    public List<string> LikelyPathwayIds { get; set; } = new();

    /// <summary>
    /// Gets or sets ranked pathway classification candidates.
    /// </summary>
    public List<PathwayClassificationCandidate> Candidates { get; set; } = new();

    /// <summary>
    /// Gets or sets selected pathway id.
    /// </summary>
    public string SelectedPathwayId { get; set; }

    /// <summary>
    /// Gets or sets selected intake mode (approved_json or apc_fallback).
    /// </summary>
    public string IntakeMode { get; set; }

    /// <summary>
    /// Gets or sets whether disambiguation prompt is recommended.
    /// </summary>
    public bool ShouldAskDisambiguation { get; set; }

    /// <summary>
    /// Gets or sets disambiguation prompt when confidence is low.
    /// </summary>
    public string DisambiguationPrompt { get; set; }

    /// <summary>
    /// Gets or sets overall classification confidence.
    /// </summary>
    public string ConfidenceBand { get; set; }

    /// <summary>
    /// Gets or sets selected APC catalog sections for fallback retrieval.
    /// </summary>
    public List<string> FallbackSectionIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected APC summaries for fallback question generation.
    /// </summary>
    public List<string> FallbackSummaryIds { get; set; } = new();

    /// <summary>
    /// Gets or sets mapped pathway input values inferred from intake text.
    /// </summary>
    public Dictionary<string, object> MappedInputValues { get; set; } = new();
}

/// <summary>
/// Contract for generic intake extraction and pathway selection.
/// </summary>
public interface IPathwayExtractionService
{
    /// <summary>
    /// Extracts symptoms, classifies pathways, and maps input values.
    /// </summary>
    Task<PathwayExtractionResult> ExtractAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms);
}

/// <summary>
/// Generic extraction service decoupled from specific pathway clinical logic.
/// </summary>
