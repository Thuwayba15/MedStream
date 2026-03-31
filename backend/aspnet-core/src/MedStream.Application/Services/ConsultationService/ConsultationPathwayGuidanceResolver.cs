#nullable enable
using Abp.Dependency;
using MedStream.PatientIntake;
using MedStream.PatientIntake.Pathways;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.Consultation;

/// <summary>
/// Resolves bounded pathway and APC guidance for consultation drafting.
/// </summary>
public interface IConsultationPathwayGuidanceResolver
{
    ConsultationPathwayGuidance Resolve(string? pathwayId, string? chiefComplaint);
}

/// <summary>
/// Provides pathway-linked assessment, plan, and APC guidance without inventing unsupported clinical content.
/// </summary>
public class ConsultationPathwayGuidanceResolver : IConsultationPathwayGuidanceResolver, ISingletonDependency
{
    private readonly IPathwayDefinitionProvider _pathwayDefinitionProvider;
    private readonly IApcCatalogProvider _apcCatalogProvider;
    private readonly IApcSummaryProvider _apcSummaryProvider;

    public ConsultationPathwayGuidanceResolver(
        IPathwayDefinitionProvider pathwayDefinitionProvider,
        IApcCatalogProvider apcCatalogProvider,
        IApcSummaryProvider apcSummaryProvider)
    {
        _pathwayDefinitionProvider = pathwayDefinitionProvider;
        _apcCatalogProvider = apcCatalogProvider;
        _apcSummaryProvider = apcSummaryProvider;
    }

    public ConsultationPathwayGuidance Resolve(string? pathwayId, string? chiefComplaint)
    {
        var guidance = new ConsultationPathwayGuidance();
        var normalizedPathwayId = NormalizePathwayId(pathwayId);
        var complaint = (chiefComplaint ?? string.Empty).Trim();

        PathwayDefinitionJson? pathwayDefinition = null;
        if (!string.IsNullOrWhiteSpace(normalizedPathwayId))
        {
            try
            {
                pathwayDefinition = _pathwayDefinitionProvider.GetById(normalizedPathwayId);
            }
            catch
            {
                pathwayDefinition = null;
            }
        }

        guidance.PathwayId = pathwayDefinition?.Id ?? normalizedPathwayId ?? string.Empty;
        guidance.PathwayName = pathwayDefinition?.Name ?? string.Empty;
        guidance.PathwayAssessmentHints = pathwayDefinition == null
            ? new List<string>()
            : ResolveAssessmentHints(pathwayDefinition).ToList();
        guidance.PathwayPlanHints = pathwayDefinition == null
            ? new List<string>()
            : ResolvePlanHints(pathwayDefinition).ToList();
        guidance.ObjectiveFocusHints = pathwayDefinition == null
            ? new List<string>()
            : ResolveObjectiveHints(pathwayDefinition);

        var apcSummary = ResolveApcSummary(pathwayDefinition, complaint);
        var apcSection = ResolveApcSection(pathwayDefinition, apcSummary, complaint);

        if (apcSummary != null)
        {
            guidance.ApcSummaryTitle = apcSummary.Title ?? string.Empty;
            foreach (var item in apcSummary.ClinicianObjectiveFocus.Where(item => !string.IsNullOrWhiteSpace(item)))
            {
                AddDistinct(guidance.ObjectiveFocusHints, item.Trim());
            }

            foreach (var item in ResolveApcLinks(apcSummary))
            {
                AddDistinct(guidance.ApcReferenceLinks, item);
            }
        }

        if (apcSection != null)
        {
            guidance.ApcSectionTitle = apcSection.Title ?? string.Empty;
            guidance.ApcSectionPage = apcSection.Page;
            if (!string.IsNullOrWhiteSpace(apcSection.Title))
            {
                AddDistinct(guidance.ApcReferenceLinks, apcSection.Page.HasValue
                    ? $"{apcSection.Title} (APC p.{apcSection.Page.Value})"
                    : apcSection.Title);
            }
        }

        return guidance;
    }

    private IReadOnlyList<string> ResolveAssessmentHints(PathwayDefinitionJson pathwayDefinition)
    {
        var selectedIds = pathwayDefinition.SoapMapping?.AssessmentFromOutcomes ?? new List<string>();
        if (selectedIds.Count == 0)
        {
            return Array.Empty<string>();
        }

        var lookup = pathwayDefinition.Outcomes.ToDictionary(item => item.Id, item => item.Label, StringComparer.OrdinalIgnoreCase);
        return selectedIds
            .Where(item => lookup.ContainsKey(item))
            .Select(item => lookup[item])
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private IReadOnlyList<string> ResolvePlanHints(PathwayDefinitionJson pathwayDefinition)
    {
        var selectedIds = pathwayDefinition.SoapMapping?.PlanFromRecommendations ?? new List<string>();
        if (selectedIds.Count == 0)
        {
            return Array.Empty<string>();
        }

        var lookup = pathwayDefinition.Recommendations.ToDictionary(item => item.Id, item => item.Label, StringComparer.OrdinalIgnoreCase);
        return selectedIds
            .Where(item => lookup.ContainsKey(item))
            .Select(item => lookup[item])
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private List<string> ResolveObjectiveHints(PathwayDefinitionJson pathwayDefinition)
    {
        return pathwayDefinition.Inputs
            .Where(item =>
                string.Equals(item.Stage, "clinician_review", StringComparison.OrdinalIgnoreCase) &&
                item.Tags.Any(tag => string.Equals(tag, "objective", StringComparison.OrdinalIgnoreCase) || string.Equals(tag, "vitals", StringComparison.OrdinalIgnoreCase)))
            .Select(item => string.IsNullOrWhiteSpace(item.Unit) ? item.Label : $"{item.Label} ({item.Unit})")
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private ApcSummaryJson? ResolveApcSummary(PathwayDefinitionJson? pathwayDefinition, string chiefComplaint)
    {
        var summaries = _apcSummaryProvider.GetAllSummaries();

        if (pathwayDefinition != null)
        {
            var directMatch = summaries.FirstOrDefault(item =>
                item.LikelyLinks.Any(link => string.Equals(link.TargetPathwayId, pathwayDefinition.Id, StringComparison.OrdinalIgnoreCase)) ||
                item.ComplaintCues.Any(cue => MatchesText(pathwayDefinition.Name, cue)) ||
                item.ComplaintCues.Any(cue => MatchesText(chiefComplaint, cue)));
            if (directMatch != null)
            {
                return directMatch;
            }
        }

        return summaries
            .OrderByDescending(item => ScoreComplaintMatch(item.ComplaintCues, chiefComplaint))
            .ThenBy(item => item.Title)
            .FirstOrDefault(item => ScoreComplaintMatch(item.ComplaintCues, chiefComplaint) > 0);
    }

    private ApcCatalogSectionJson? ResolveApcSection(PathwayDefinitionJson? pathwayDefinition, ApcSummaryJson? apcSummary, string chiefComplaint)
    {
        var sections = _apcCatalogProvider.GetAllSections();

        if (pathwayDefinition != null)
        {
            var direct = sections.FirstOrDefault(item => string.Equals(item.Id, pathwayDefinition.Id, StringComparison.OrdinalIgnoreCase));
            if (direct != null)
            {
                return direct;
            }

            if (pathwayDefinition.Source?.Pages?.Count > 0)
            {
                direct = sections.FirstOrDefault(item => item.Page.HasValue && pathwayDefinition.Source.Pages.Contains(item.Page.Value));
                if (direct != null)
                {
                    return direct;
                }
            }
        }

        if (apcSummary != null)
        {
            foreach (var link in apcSummary.LikelyLinks)
            {
                var linked = sections.FirstOrDefault(item => string.Equals(item.Id, link.TargetPathwayId, StringComparison.OrdinalIgnoreCase));
                if (linked != null)
                {
                    return linked;
                }
            }
        }

        return sections
            .OrderByDescending(item => ScoreComplaintMatch(item.Keywords, chiefComplaint))
            .ThenBy(item => item.Title)
            .FirstOrDefault(item => ScoreComplaintMatch(item.Keywords, chiefComplaint) > 0);
    }

    private IReadOnlyList<string> ResolveApcLinks(ApcSummaryJson summary)
    {
        var sections = _apcCatalogProvider.GetAllSections();
        return summary.LikelyLinks
            .Select(link =>
            {
                var section = sections.FirstOrDefault(item => string.Equals(item.Id, link.TargetPathwayId, StringComparison.OrdinalIgnoreCase));
                var title = section?.Title ?? HumanizePathwayId(link.TargetPathwayId);
                return link.Page.HasValue ? $"{title} (APC p.{link.Page.Value})" : title;
            })
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static void AddDistinct(ICollection<string> items, string value)
    {
        if (!items.Contains(value, StringComparer.OrdinalIgnoreCase))
        {
            items.Add(value);
        }
    }

    private static string NormalizePathwayId(string? pathwayId)
    {
        if (string.IsNullOrWhiteSpace(pathwayId) ||
            string.Equals(pathwayId, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        return pathwayId.Trim();
    }

    private static int ScoreComplaintMatch(IEnumerable<string> cues, string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        return cues.Count(cue => MatchesText(text, cue));
    }

    private static bool MatchesText(string? text, string? cue)
    {
        return !string.IsNullOrWhiteSpace(text) &&
               !string.IsNullOrWhiteSpace(cue) &&
               text.Contains(cue, StringComparison.OrdinalIgnoreCase);
    }

    private static string HumanizePathwayId(string? pathwayId)
    {
        if (string.IsNullOrWhiteSpace(pathwayId))
        {
            return string.Empty;
        }

        var text = pathwayId.Replace("_", " ");
        return char.ToUpperInvariant(text[0]) + text[1..];
    }
}

/// <summary>
/// Structured pathway guidance used to constrain consultation drafting.
/// </summary>
public class ConsultationPathwayGuidance
{
    public string PathwayId { get; set; } = string.Empty;

    public string PathwayName { get; set; } = string.Empty;

    public string ApcSummaryTitle { get; set; } = string.Empty;

    public string ApcSectionTitle { get; set; } = string.Empty;

    public int? ApcSectionPage { get; set; }

    public List<string> PathwayAssessmentHints { get; set; } = new();

    public List<string> PathwayPlanHints { get; set; } = new();

    public List<string> ObjectiveFocusHints { get; set; } = new();

    public List<string> ApcReferenceLinks { get; set; } = new();
}
