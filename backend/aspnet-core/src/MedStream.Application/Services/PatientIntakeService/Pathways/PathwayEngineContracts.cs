using System.Collections.Generic;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Request payload for pathway execution.
/// </summary>
public class PathwayExecutionRequest
{
    /// <summary>
    /// Gets or sets pathway id.
    /// </summary>
    public string PathwayId { get; set; }

    /// <summary>
    /// Gets or sets execution stage id.
    /// </summary>
    public string StageId { get; set; }

    /// <summary>
    /// Gets or sets audience role (patient/clinician).
    /// </summary>
    public string Audience { get; set; }

    /// <summary>
    /// Gets or sets primary symptom hints.
    /// </summary>
    public IReadOnlyCollection<string> PrimarySymptoms { get; set; } = new List<string>();

    /// <summary>
    /// Gets or sets patient answers.
    /// </summary>
    public IReadOnlyDictionary<string, object> Answers { get; set; } = new Dictionary<string, object>();

    /// <summary>
    /// Gets or sets clinician observations.
    /// </summary>
    public IReadOnlyDictionary<string, object> Observations { get; set; } = new Dictionary<string, object>();
}

/// <summary>
/// Execution output for a pathway run.
/// </summary>
public class PathwayExecutionResult
{
    /// <summary>
    /// Gets or sets pathway id.
    /// </summary>
    public string PathwayId { get; set; }

    /// <summary>
    /// Gets or sets next questions for requested stage/audience.
    /// </summary>
    public List<PathwayInputJson> NextQuestions { get; set; } = new();

    /// <summary>
    /// Gets or sets triggered red flags.
    /// </summary>
    public List<string> TriggeredRedFlags { get; set; } = new();

    /// <summary>
    /// Gets or sets triage indicators.
    /// </summary>
    public Dictionary<string, string> TriageIndicators { get; set; } = new();

    /// <summary>
    /// Gets or sets outcome hint ids.
    /// </summary>
    public List<string> TriggeredOutcomeIds { get; set; } = new();

    /// <summary>
    /// Gets or sets recommendation ids.
    /// </summary>
    public List<string> TriggeredRecommendationIds { get; set; } = new();

    /// <summary>
    /// Gets or sets triggered links.
    /// </summary>
    public List<PathwayTriggeredLink> TriggeredLinks { get; set; } = new();

    /// <summary>
    /// Gets or sets cumulative score.
    /// </summary>
    public decimal Score { get; set; }

    /// <summary>
    /// Gets or sets fired rule trace records.
    /// </summary>
    public List<PathwayRuleTraceItem> RuleTrace { get; set; } = new();
}

/// <summary>
/// Triggered pathway link result.
/// </summary>
public class PathwayTriggeredLink
{
    /// <summary>
    /// Gets or sets link id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets label.
    /// </summary>
    public string Label { get; set; }

    /// <summary>
    /// Gets or sets target pathway id.
    /// </summary>
    public string TargetPathwayId { get; set; }

    /// <summary>
    /// Gets or sets source page reference.
    /// </summary>
    public int? SourcePage { get; set; }
}

/// <summary>
/// Rule trace item for audit/debug.
/// </summary>
public class PathwayRuleTraceItem
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
    /// Gets or sets whether rule fired.
    /// </summary>
    public bool Triggered { get; set; }

    /// <summary>
    /// Gets or sets effect summary text.
    /// </summary>
    public string EffectsSummary { get; set; }
}

/// <summary>
/// Pathway definition provider contract.
/// </summary>
public interface IPathwayDefinitionProvider
{
    /// <summary>
    /// Loads a pathway definition by id.
    /// </summary>
    PathwayDefinitionJson GetById(string pathwayId);

    /// <summary>
    /// Returns all active pathway definitions.
    /// </summary>
    IReadOnlyCollection<PathwayDefinitionJson> GetAllActive();
}

/// <summary>
/// Classifies likely pathways from intake text and extracted symptoms.
/// </summary>
public interface IPathwayClassifier
{
    /// <summary>
    /// Returns deterministic ranked pathway candidates for provided intake signal.
    /// </summary>
    PathwayClassificationResult ClassifyLikelyPathways(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms);
}

/// <summary>
/// Condition evaluator contract.
/// </summary>
public interface IPathwayConditionEvaluator
{
    /// <summary>
    /// Evaluates a condition against merged answer and observation context.
    /// </summary>
    bool Evaluate(PathwayConditionJson condition, IReadOnlyDictionary<string, object> context);
}

/// <summary>
/// Pathway execution contract.
/// </summary>
public interface IPathwayExecutionEngine
{
    /// <summary>
    /// Executes a pathway and returns structured decision output.
    /// </summary>
    PathwayExecutionResult Execute(PathwayExecutionRequest request);
}
