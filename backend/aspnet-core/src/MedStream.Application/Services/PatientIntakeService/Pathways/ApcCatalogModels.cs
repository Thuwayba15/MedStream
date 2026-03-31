using System.Collections.Generic;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Root APC retrieval catalog model.
/// </summary>
public class ApcCatalogJson
{
    /// <summary>
    /// Gets or sets catalog id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets catalog sections.
    /// </summary>
    public List<ApcCatalogSectionJson> Sections { get; set; } = new();
}

/// <summary>
/// APC catalog section model used for retrieval routing.
/// </summary>
public class ApcCatalogSectionJson
{
    /// <summary>
    /// Gets or sets section id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets section title.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// Gets or sets section page.
    /// </summary>
    public int? Page { get; set; }

    /// <summary>
    /// Gets or sets whether the section can be used as initial entry pathway.
    /// </summary>
    public bool IsEntryPathway { get; set; }

    /// <summary>
    /// Gets or sets section symptom category.
    /// </summary>
    public string SymptomCategory { get; set; }

    /// <summary>
    /// Gets or sets retrieval keywords.
    /// </summary>
    public List<string> Keywords { get; set; } = new();

    /// <summary>
    /// Gets or sets body region hints.
    /// </summary>
    public List<string> BodyRegions { get; set; } = new();
}

/// <summary>
/// Root APC summary model.
/// </summary>
public class ApcSummariesJson
{
    /// <summary>
    /// Gets or sets summary package id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets summary rows.
    /// </summary>
    public List<ApcSummaryJson> Summaries { get; set; } = new();
}

/// <summary>
/// APC fallback summary row used to generate temporary subjective questions.
/// </summary>
public class ApcSummaryJson
{
    /// <summary>
    /// Gets or sets summary id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets summary title.
    /// </summary>
    public string Title { get; set; }

    /// <summary>
    /// Gets or sets symptom category.
    /// </summary>
    public string SymptomCategory { get; set; }

    /// <summary>
    /// Gets or sets complaint cues.
    /// </summary>
    public List<string> ComplaintCues { get; set; } = new();

    /// <summary>
    /// Gets or sets urgent subjective red-flag questions.
    /// </summary>
    public List<string> UrgentSubjectiveRedFlags { get; set; } = new();

    /// <summary>
    /// Gets or sets core subjective questions.
    /// </summary>
    public List<string> CoreSubjectiveQuestions { get; set; } = new();

    /// <summary>
    /// Gets or sets AI fallback guidance metadata.
    /// </summary>
    public ApcSummaryAiFallbackGuidanceJson AiFallbackGuidance { get; set; }

    /// <summary>
    /// Gets or sets clinician objective focus guidance.
    /// </summary>
    public List<string> ClinicianObjectiveFocus { get; set; } = new();

    /// <summary>
    /// Gets or sets likely linked APC pathways.
    /// </summary>
    public List<ApcSummaryLinkedPathwayJson> LikelyLinks { get; set; } = new();
}

/// <summary>
/// APC summary linked pathway metadata.
/// </summary>
public class ApcSummaryLinkedPathwayJson
{
    /// <summary>
    /// Gets or sets target pathway id.
    /// </summary>
    public string TargetPathwayId { get; set; }

    /// <summary>
    /// Gets or sets APC source page.
    /// </summary>
    public int? Page { get; set; }
}

/// <summary>
/// APC summary AI guidance.
/// </summary>
public class ApcSummaryAiFallbackGuidanceJson
{
    /// <summary>
    /// Gets or sets maximum number of generated fallback questions.
    /// </summary>
    public int MaxQuestions { get; set; } = 6;
}
