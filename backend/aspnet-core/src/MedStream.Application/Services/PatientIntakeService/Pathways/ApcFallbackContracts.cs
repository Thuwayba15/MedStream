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
public class ApcFallbackContext
{
    /// <summary>
    /// Gets or sets selected APC catalog section ids.
    /// </summary>
    public List<string> SectionIds { get; set; } = new();

    /// <summary>
    /// Gets or sets selected APC summary ids.
    /// </summary>
    public List<string> SummaryIds { get; set; } = new();
}

/// <summary>
/// Contract for APC fallback retrieval routing.
/// </summary>
public interface IApcFallbackRoutingService
{
    /// <summary>
    /// Selects relevant APC catalog sections and summaries for fallback mode.
    /// </summary>
    ApcFallbackContext Resolve(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms);
}

/// <summary>
/// Contract for APC summary-backed fallback question generation.
/// </summary>
public interface IApcFallbackQuestionService
{
    /// <summary>
    /// Generates temporary subjective intake questions from APC summaries.
    /// </summary>
    Task<List<IntakeQuestionDto>> GenerateQuestionsAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms, IReadOnlyCollection<string> extractedPrimarySymptoms, IReadOnlyCollection<string> summaryIds);
}

/// <summary>
/// Deterministic APC retrieval router for fallback mode.
/// </summary>
