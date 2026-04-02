using Abp.Dependency;
using Castle.Core.Logging;
using MedStream.PatientIntake.Dto;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Routing context for APC fallback mode.
/// </summary>
public class ApcFallbackRoutingService : IApcFallbackRoutingService, ITransientDependency
{
    private readonly IApcCatalogProvider _catalogProvider;
    private readonly IApcSummaryProvider _summaryProvider;
    private readonly IComplaintTextNormalizer _normalizer;

    /// <summary>
    /// Gets or sets logger.
    /// </summary>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApcFallbackRoutingService"/> class.
    /// </summary>
    public ApcFallbackRoutingService(
        IApcCatalogProvider catalogProvider,
        IApcSummaryProvider summaryProvider,
        IComplaintTextNormalizer normalizer)
    {
        _catalogProvider = catalogProvider;
        _summaryProvider = summaryProvider;
        _normalizer = normalizer;
        Logger = NullLogger.Instance;
    }

    /// <inheritdoc />
    public ApcFallbackContext Resolve(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms)
    {
        Logger.Info($"[Intake][APC-Routing] Start. freeTextLength={(freeText ?? string.Empty).Length}, selectedSymptomsCount={selectedSymptoms?.Count ?? 0}, extractedCount={extractedPrimarySymptoms?.Count ?? 0}");
        var normalized = _normalizer.Normalize(freeText, selectedSymptoms, extractedPrimarySymptoms);
        var entrySections = _catalogProvider.GetAllSections()
            .Where(item => item.IsEntryPathway)
            .Select(item => new
            {
                Section = item,
                Score = ScoreSection(item, normalized)
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Section.Id, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        var sectionIds = entrySections.Select(item => item.Section.Id).ToList();
        var allSummaries = _summaryProvider.GetAllSummaries();
        var summaryIds = allSummaries
            .Select(item => new
            {
                Summary = item,
                Score = ScoreSummary(item, normalized, sectionIds)
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Summary.Id, StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .Select(item => item.Summary.Id)
            .ToList();

        if (summaryIds.Count == 0)
        {
            summaryIds = allSummaries.Take(1).Select(item => item.Id).ToList();
        }

        Logger.Info($"[Intake][APC-Routing] Selected sections={string.Join(", ", sectionIds)}; summaries={string.Join(", ", summaryIds)}");

        return new ApcFallbackContext
        {
            SectionIds = sectionIds,
            SummaryIds = summaryIds
        };
    }

    private static decimal ScoreSection(ApcCatalogSectionJson section, NormalizedComplaintText normalized)
    {
        var score = 0m;
        foreach (var keyword in section.Keywords ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                score += 8m;
            }
        }

        foreach (var bodyRegion in section.BodyRegions ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(bodyRegion, StringComparison.OrdinalIgnoreCase))
            {
                score += 4m;
            }
        }

        if (!string.IsNullOrWhiteSpace(section.SymptomCategory) &&
            normalized.NormalizedText.Contains(section.SymptomCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 6m;
        }

        return score;
    }

    private static decimal ScoreSummary(ApcSummaryJson summary, NormalizedComplaintText normalized, IReadOnlyCollection<string> sectionIds)
    {
        var score = 0m;
        if (sectionIds.Contains(summary.Id, StringComparer.OrdinalIgnoreCase))
        {
            score += 20m;
        }

        foreach (var cue in summary.ComplaintCues ?? new List<string>())
        {
            if (normalized.NormalizedText.Contains(cue, StringComparison.OrdinalIgnoreCase))
            {
                score += 6m;
            }
        }

        if (!string.IsNullOrWhiteSpace(summary.SymptomCategory) &&
            normalized.NormalizedText.Contains(summary.SymptomCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 5m;
        }

        return score;
    }
}

/// <summary>
/// APC summary-backed fallback question generator.
/// </summary>
