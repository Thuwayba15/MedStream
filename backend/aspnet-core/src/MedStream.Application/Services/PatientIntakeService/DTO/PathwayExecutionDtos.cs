using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Rule trace entry for pathway execution.
/// </summary>
public class PathwayRuleTraceDto
{
    /// <summary>
    /// Gets or sets rule id.
    /// </summary>
    public string RuleId { get; set; }

    /// <summary>
    /// Gets or sets rule label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets whether the rule fired.
    /// </summary>
    public bool Triggered { get; set; }

    /// <summary>
    /// Gets or sets summarized effects for the rule.
    /// </summary>
    public string EffectsSummary { get; set; }
}

/// <summary>
/// Linked pathway trigger output.
/// </summary>
public class PathwayTriggeredLinkDto
{
    /// <summary>
    /// Gets or sets link id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets link label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets linked pathway id.
    /// </summary>
    public string TargetPathwayId { get; set; }

    /// <summary>
    /// Gets or sets source page reference.
    /// </summary>
    public int? SourcePage { get; set; }
}

/// <summary>
/// Extended execution data returned for clinical decision support traceability.
/// </summary>
public class PathwayExecutionSummaryDto
{
    /// <summary>
    /// Gets or sets triggered red flags.
    /// </summary>
    public List<string> TriggeredRedFlags { get; set; } = new();

    /// <summary>
    /// Gets or sets triage indicators.
    /// </summary>
    public Dictionary<string, string> TriageIndicators { get; set; } = new();

    /// <summary>
    /// Gets or sets triggered outcome hint ids.
    /// </summary>
    public List<string> TriggeredOutcomeIds { get; set; } = new();

    /// <summary>
    /// Gets or sets triggered recommendation ids.
    /// </summary>
    public List<string> TriggeredRecommendationIds { get; set; } = new();

    /// <summary>
    /// Gets or sets triggered pathway links.
    /// </summary>
    public List<PathwayTriggeredLinkDto> TriggeredLinks { get; set; } = new();

    /// <summary>
    /// Gets or sets rule trace list.
    /// </summary>
    public List<PathwayRuleTraceDto> RuleTrace { get; set; } = new();
}
