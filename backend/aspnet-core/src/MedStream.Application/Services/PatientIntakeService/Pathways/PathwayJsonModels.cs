using System.Collections.Generic;
using System.Text.Json;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// JSON definition root for a clinical pathway.
/// </summary>
public class PathwayDefinitionJson
{
    /// <summary>
    /// Gets or sets stable pathway id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets human-readable pathway name.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets semantic version for pathway definition.
    /// </summary>
    public string Version { get; set; }

    /// <summary>
    /// Gets or sets activation status.
    /// </summary>
    public string Status { get; set; }

    /// <summary>
    /// Gets or sets source reference metadata.
    /// </summary>
    public PathwaySourceJson Source { get; set; }

    /// <summary>
    /// Gets or sets pathway entry metadata.
    /// </summary>
    public PathwayEntryJson Entry { get; set; }

    /// <summary>
    /// Gets or sets visibility flags.
    /// </summary>
    public PathwayVisibilityJson Visibility { get; set; }

    /// <summary>
    /// Gets or sets defined stages.
    /// </summary>
    public List<PathwayStageJson> Stages { get; set; } = new();

    /// <summary>
    /// Gets or sets pathway input definitions.
    /// </summary>
    public List<PathwayInputJson> Inputs { get; set; } = new();

    /// <summary>
    /// Gets or sets top-level rules.
    /// </summary>
    public List<PathwayRuleJson> GlobalChecks { get; set; } = new();

    /// <summary>
    /// Gets or sets branch flow rules.
    /// </summary>
    public List<PathwayFlowJson> Flows { get; set; } = new();

    /// <summary>
    /// Gets or sets outcome metadata.
    /// </summary>
    public List<PathwayOutcomeJson> Outcomes { get; set; } = new();

    /// <summary>
    /// Gets or sets recommendation metadata.
    /// </summary>
    public List<PathwayRecommendationJson> Recommendations { get; set; } = new();

    /// <summary>
    /// Gets or sets declarative pathway links.
    /// </summary>
    public List<PathwayLinkJson> Links { get; set; } = new();

    /// <summary>
    /// Gets or sets triage config section.
    /// </summary>
    public PathwayTriageJson Triage { get; set; }

    /// <summary>
    /// Gets or sets SOAP mapping metadata.
    /// </summary>
    public PathwaySoapMappingJson SoapMapping { get; set; }
}

/// <summary>
/// Source metadata block.
/// </summary>
public class PathwaySourceJson
{
    /// <summary>
    /// Gets or sets source type.
    /// </summary>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets source document name.
    /// </summary>
    public string Document { get; set; }

    /// <summary>
    /// Gets or sets source pages.
    /// </summary>
    public List<int> Pages { get; set; } = new();

    /// <summary>
    /// Gets or sets source notes.
    /// </summary>
    public string Notes { get; set; }
}

/// <summary>
/// Entry criteria metadata.
/// </summary>
public class PathwayEntryJson
{
    /// <summary>
    /// Gets or sets whether this pathway is directly classifiable from intake complaint text.
    /// </summary>
    public bool IsEntryPathway { get; set; }

    /// <summary>
    /// Gets or sets keyword hints.
    /// </summary>
    public List<string> ComplaintKeywords { get; set; } = new();

    /// <summary>
    /// Gets or sets synonym phrases for complaint matching.
    /// </summary>
    public List<string> Synonyms { get; set; } = new();

    /// <summary>
    /// Gets or sets common patient phrase patterns.
    /// </summary>
    public List<string> CommonPhrases { get; set; } = new();

    /// <summary>
    /// Gets or sets phrases that should penalize this pathway match.
    /// </summary>
    public List<string> ExcludePhrases { get; set; } = new();

    /// <summary>
    /// Gets or sets high-level symptom category.
    /// </summary>
    public string SymptomCategory { get; set; }

    /// <summary>
    /// Gets or sets body region hints for classification.
    /// </summary>
    public List<string> BodyRegions { get; set; } = new();

    /// <summary>
    /// Gets or sets pathway metadata priority (lower is higher priority).
    /// </summary>
    public int Priority { get; set; } = 99;

    /// <summary>
    /// Gets or sets complaint code hints.
    /// </summary>
    public List<string> ComplaintCodes { get; set; } = new();

    /// <summary>
    /// Gets or sets applicability block.
    /// </summary>
    public PathwayAppliesToJson AppliesTo { get; set; }
}

/// <summary>
/// Age and population scope metadata.
/// </summary>
public class PathwayAppliesToJson
{
    /// <summary>
    /// Gets or sets minimum age.
    /// </summary>
    public int? MinAge { get; set; }
}

/// <summary>
/// Visibility metadata for pathway outputs.
/// </summary>
public class PathwayVisibilityJson
{
    /// <summary>
    /// Gets or sets whether patients can answer pathway questions.
    /// </summary>
    public bool PatientCanAnswer { get; set; }

    /// <summary>
    /// Gets or sets whether patient can see outcome hints.
    /// </summary>
    public bool PatientCanSeeOutcomes { get; set; }

    /// <summary>
    /// Gets or sets whether recommendations are clinician-only.
    /// </summary>
    public bool ClinicianOnlyRecommendations { get; set; }
}

/// <summary>
/// Stage definition.
/// </summary>
public class PathwayStageJson
{
    /// <summary>
    /// Gets or sets stage id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets stage name.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets stage type.
    /// </summary>
    public string Type { get; set; }
}

/// <summary>
/// Input question/observation definition.
/// </summary>
public class PathwayInputJson
{
    /// <summary>
    /// Gets or sets input id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets input label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets input type.
    /// </summary>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets stage id.
    /// </summary>
    public string Stage { get; set; }

    /// <summary>
    /// Gets or sets producer role for the input.
    /// </summary>
    public string EnteredBy { get; set; }

    /// <summary>
    /// Gets or sets required flag.
    /// </summary>
    public bool Required { get; set; }

    /// <summary>
    /// Gets or sets order in the stage list.
    /// </summary>
    public int? DisplayOrder { get; set; }

    /// <summary>
    /// Gets or sets optional unit.
    /// </summary>
    public string Unit { get; set; }

    /// <summary>
    /// Gets or sets optional tags.
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Gets or sets option list for select-like inputs.
    /// </summary>
    public List<PathwayOptionJson> Options { get; set; } = new();

    /// <summary>
    /// Gets or sets optional visibility condition.
    /// </summary>
    public PathwayConditionJson When { get; set; }

    /// <summary>
    /// Gets or sets optional frontend expression compatibility field.
    /// </summary>
    public string ShowWhenExpression { get; set; }
}

/// <summary>
/// Select option definition.
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
