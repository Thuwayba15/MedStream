using System.Collections.Generic;
using System.Text.Json;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// JSON definition root for a clinical pathway.
/// </summary>
public class PathwayOptionJson
{
    /// <summary>
    /// Gets or sets option id/value.
    /// </summary>
    public string Value { get; set; }

    /// <summary>
    /// Gets or sets option label.
    /// </summary>
    public string Label { get; set; }
}

/// <summary>
/// Condition tree definition.
/// </summary>
public class PathwayConditionJson
{
    /// <summary>
    /// Gets or sets all-child conditions.
    /// </summary>
    public List<PathwayConditionJson> All { get; set; } = new();

    /// <summary>
    /// Gets or sets any-child conditions.
    /// </summary>
    public List<PathwayConditionJson> Any { get; set; } = new();

    /// <summary>
    /// Gets or sets input id for leaf condition.
    /// </summary>
    public string Input { get; set; }

    /// <summary>
    /// Gets or sets leaf operator.
    /// </summary>
    public string Operator { get; set; }

    /// <summary>
    /// Gets or sets leaf comparison value.
    /// </summary>
    public JsonElement? Value { get; set; }
}

/// <summary>
/// Pathway rule definition.
/// </summary>
public class PathwayRuleJson
{
    /// <summary>
    /// Gets or sets rule id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets optional human label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets severity.
    /// </summary>
    public string Severity { get; set; }

    /// <summary>
    /// Gets or sets rule condition.
    /// </summary>
    public PathwayConditionJson When { get; set; }

    /// <summary>
    /// Gets or sets effects to apply when triggered.
    /// </summary>
    public List<PathwayEffectJson> Effects { get; set; } = new();
}

/// <summary>
/// Flow branch definition.
/// </summary>
public class PathwayFlowJson
{
    /// <summary>
    /// Gets or sets flow id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets flow condition.
    /// </summary>
    public PathwayConditionJson When { get; set; }

    /// <summary>
    /// Gets or sets flow rules.
    /// </summary>
    public List<PathwayRuleJson> Rules { get; set; } = new();
}

/// <summary>
/// Effect emitted when a rule triggers.
/// </summary>
public class PathwayEffectJson
{
    /// <summary>
    /// Gets or sets effect type.
    /// </summary>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets flag code.
    /// </summary>
    public string Flag { get; set; }

    /// <summary>
    /// Gets or sets outcome id reference.
    /// </summary>
    public string OutcomeId { get; set; }

    /// <summary>
    /// Gets or sets recommendation id reference.
    /// </summary>
    public string RecommendationId { get; set; }

    /// <summary>
    /// Gets or sets target pathway id for link effects.
    /// </summary>
    public string TargetPathwayId { get; set; }

    /// <summary>
    /// Gets or sets score delta.
    /// </summary>
    public decimal? Value { get; set; }

    /// <summary>
    /// Gets or sets red flag label.
    /// </summary>
    public string RedFlag { get; set; }

    /// <summary>
    /// Gets or sets triage indicator key.
    /// </summary>
    public string Indicator { get; set; }

    /// <summary>
    /// Gets or sets triage indicator value.
    /// </summary>
    public string IndicatorValue { get; set; }
}

/// <summary>
/// Outcome metadata.
/// </summary>
public class PathwayOutcomeJson
{
    /// <summary>
    /// Gets or sets outcome id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets outcome label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets category.
    /// </summary>
    public string Category { get; set; }

    /// <summary>
    /// Gets or sets severity.
    /// </summary>
    public string Severity { get; set; }

    /// <summary>
    /// Gets or sets patient visibility.
    /// </summary>
    public bool PatientVisible { get; set; }
}

/// <summary>
/// Recommendation metadata.
/// </summary>
public class PathwayRecommendationJson
{
    /// <summary>
    /// Gets or sets recommendation id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets recommendation label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets recommendation type.
    /// </summary>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets clinician-only flag.
    /// </summary>
    public bool ClinicianOnly { get; set; }
}

/// <summary>
/// Linked pathway definition.
/// </summary>
public class PathwayLinkJson
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
    /// Gets or sets link activation condition.
    /// </summary>
    public PathwayConditionJson When { get; set; }

    /// <summary>
    /// Gets or sets target pathway id.
    /// </summary>
    public string TargetPathwayId { get; set; }

    /// <summary>
    /// Gets or sets link type.
    /// </summary>
    public string LinkType { get; set; }

    /// <summary>
    /// Gets or sets source reference.
    /// </summary>
    public PathwaySourceReferenceJson SourceReference { get; set; }
}

/// <summary>
/// Source reference metadata for a link.
/// </summary>
public class PathwaySourceReferenceJson
{
    /// <summary>
    /// Gets or sets source page.
    /// </summary>
    public int? Page { get; set; }
}

/// <summary>
/// Optional triage config.
/// </summary>
public class PathwayTriageJson
{
    /// <summary>
    /// Gets or sets initial score baseline.
    /// </summary>
    public decimal BaseScore { get; set; }

    /// <summary>
    /// Gets or sets priority threshold.
    /// </summary>
    public decimal PriorityThreshold { get; set; }

    /// <summary>
    /// Gets or sets urgent threshold.
    /// </summary>
    public decimal UrgentThreshold { get; set; }

    /// <summary>
    /// Gets or sets routine explanation template.
    /// </summary>
    public string RoutineExplanationTemplate { get; set; }

    /// <summary>
    /// Gets or sets priority explanation template.
    /// </summary>
    public string PriorityExplanationTemplate { get; set; }

    /// <summary>
    /// Gets or sets urgent explanation template.
    /// </summary>
    public string UrgentExplanationTemplate { get; set; }
}

/// <summary>
/// SOAP mapping metadata block.
/// </summary>
public class PathwaySoapMappingJson
{
    /// <summary>
    /// Gets or sets subjective field ids.
    /// </summary>
    public List<string> Subjective { get; set; } = new();

    /// <summary>
    /// Gets or sets objective field ids.
    /// </summary>
    public List<string> Objective { get; set; } = new();

    /// <summary>
    /// Gets or sets assessment source outcome ids.
    /// </summary>
    public List<string> AssessmentFromOutcomes { get; set; } = new();

    /// <summary>
    /// Gets or sets plan source recommendation ids.
    /// </summary>
    public List<string> PlanFromRecommendations { get; set; } = new();
}
