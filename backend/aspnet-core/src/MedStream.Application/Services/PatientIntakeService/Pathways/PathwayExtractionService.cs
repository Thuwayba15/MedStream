using Abp.Dependency;
using Castle.Core.Logging;
using MedStream.PatientIntake.Dto;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

public partial class PathwayExtractionService : IPathwayExtractionService, ITransientDependency
{
    private static readonly Dictionary<string, string> GenericKeywordSymptomMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "cough", "Cough" },
        { "fever", "Fever" },
        { "temperature", "Fever" },
        { "chills", "Fever" },
        { "breath", "Difficulty Breathing" },
        { "breathing", "Difficulty Breathing" },
        { "chest", "Chest Pain" },
        { "pain", "Pain" },
        { "swollen", "Swelling" },
        { "swelling", "Swelling" },
        { "fall", "Injury" },
        { "injury", "Injury" },
        { "dizzy", "Dizziness" },
        { "nausea", "Nausea" },
        { "headache", "Headache" },
        { "fatigue", "Fatigue" }
    };

    private readonly IConfiguration _configuration;
    private readonly IPathwayDefinitionProvider _definitionProvider;
    private readonly IPathwayClassifier _pathwayClassifier;
    private readonly IApcFallbackRoutingService _apcFallbackRoutingService;
    private readonly IApcSummaryProvider _apcSummaryProvider;

    /// <summary>
    /// Gets or sets logger.
    /// </summary>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="PathwayExtractionService"/> class.
    /// </summary>
    public PathwayExtractionService(
        IPathwayDefinitionProvider definitionProvider,
        IPathwayClassifier pathwayClassifier,
        IApcFallbackRoutingService apcFallbackRoutingService,
        IApcSummaryProvider apcSummaryProvider,
        IConfiguration configuration = null)
    {
        _configuration = configuration;
        _definitionProvider = definitionProvider;
        _pathwayClassifier = pathwayClassifier;
        _apcFallbackRoutingService = apcFallbackRoutingService;
        _apcSummaryProvider = apcSummaryProvider;
        Logger = NullLogger.Instance;
    }

    /// <inheritdoc />
    public async Task<PathwayExtractionResult> ExtractAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        Logger.Info($"[Intake][Extract] Start. freeTextLength={(freeText ?? string.Empty).Length}, selectedSymptomsCount={selectedSymptoms?.Count ?? 0}");
        var extractedSymptoms = ExtractDeterministicSymptoms(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());
        var extractionSource = PatientIntakeConstants.ExtractionSourceDeterministicFallback;
        Logger.Info($"[Intake][Extract] Deterministic extracted: {string.Join(", ", extractedSymptoms)}");
        if (extractedSymptoms.Count == 0 || (extractedSymptoms.Count == 1 && string.Equals(extractedSymptoms[0], "General Illness", StringComparison.OrdinalIgnoreCase)))
        {
            Logger.Info("[Intake][Extract] Deterministic signal low; attempting AI symptom extraction.");
            var aiExtractedSymptoms = await TryExtractSymptomsWithOpenAiAsync(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());
            if (aiExtractedSymptoms != null && aiExtractedSymptoms.Count > 0)
            {
                extractedSymptoms = aiExtractedSymptoms;
                extractionSource = PatientIntakeConstants.ExtractionSourceAi;
                Logger.Info($"[Intake][Extract] AI extraction used: {string.Join(", ", extractedSymptoms)}");
            }
            else
            {
                Logger.Warn("[Intake][Extract] AI extraction unavailable/empty. Falling back to deterministic extraction.");
            }
        }

        var classification = _pathwayClassifier.ClassifyLikelyPathways(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>(), extractedSymptoms);
        var likelyPathwayIds = classification.LikelyPathwayIds ?? new List<string>();
        var selectedPathwayId = ResolvePrimaryPathway(classification);
        var intakeMode = ResolveIntakeMode(classification, selectedPathwayId);
        var fallbackRouting = intakeMode == PatientIntakeConstants.IntakeModeApcFallback
            ? _apcFallbackRoutingService.Resolve(freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>(), extractedSymptoms)
            : new ApcFallbackContext();
        Logger.Info($"[Intake][Extract] Classification selectedPathway={selectedPathwayId}, intakeMode={intakeMode}, confidence={classification.ConfidenceBand}, candidates={classification.Candidates.Count}, fallbackSummaries={string.Join(", ", fallbackRouting.SummaryIds)}");
        var mappedValues = await MapInputsForPathwayAsync(selectedPathwayId, freeText ?? string.Empty, selectedSymptoms ?? Array.Empty<string>());
        var followUpPlans = BuildFollowUpPlans(selectedPathwayId, intakeMode, extractedSymptoms, fallbackRouting.SummaryIds);

        return new PathwayExtractionResult
        {
            ExtractedPrimarySymptoms = extractedSymptoms,
            ExtractionSource = extractionSource,
            LikelyPathwayIds = likelyPathwayIds,
            Candidates = classification.Candidates,
            SelectedPathwayId = selectedPathwayId,
            IntakeMode = intakeMode,
            ShouldAskDisambiguation = classification.ShouldAskDisambiguation,
            DisambiguationPrompt = classification.DisambiguationPrompt,
            ConfidenceBand = classification.ConfidenceBand.ToString(),
            FallbackSectionIds = fallbackRouting.SectionIds,
            FallbackSummaryIds = fallbackRouting.SummaryIds,
            MappedInputValues = mappedValues,
            FollowUpPlans = followUpPlans
        };
    }

    private static string ResolvePrimaryPathway(PathwayClassificationResult classification)
    {
        var selectedPathwayId = string.IsNullOrWhiteSpace(classification.SelectedPathwayId)
            ? PatientIntakeConstants.DefaultPathwayKey
            : classification.SelectedPathwayId;

        if (classification.ConfidenceBand == ClassificationConfidenceBand.Low || classification.ShouldAskDisambiguation)
        {
            return PatientIntakeConstants.GeneralFallbackPathwayKey;
        }

        return selectedPathwayId;
    }

    private static string ResolveIntakeMode(PathwayClassificationResult classification, string selectedPathwayId)
    {
        if (string.Equals(selectedPathwayId, PatientIntakeConstants.GeneralFallbackPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            return PatientIntakeConstants.IntakeModeApcFallback;
        }

        if (classification.ConfidenceBand == ClassificationConfidenceBand.Low || classification.ShouldAskDisambiguation)
        {
            return PatientIntakeConstants.IntakeModeApcFallback;
        }

        return PatientIntakeConstants.IntakeModeApprovedJson;
    }

    private async Task<Dictionary<string, object>> MapInputsForPathwayAsync(string pathwayId, string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var mappedWithAi = await TryMapInputsWithOpenAiAsync(pathwayId, freeText, selectedSymptoms);
        if (mappedWithAi.Count > 0)
        {
            return mappedWithAi;
        }

        return MapInputsDeterministically(pathwayId, freeText, selectedSymptoms);
    }

}
