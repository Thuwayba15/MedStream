#nullable enable
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.PatientIntake;

public partial class PatientIntakeAppService
{
    private static string SerializeStringList(IEnumerable<string>? values)
    {
        return JsonConvert.SerializeObject((values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList());
    }

    private static IntakeQuestionDto MapPathwayInputToQuestion(PathwayInputJson input)
    {
        return new IntakeQuestionDto
        {
            QuestionKey = input.Id,
            QuestionText = input.Label,
            InputType = MapInputType(input.Type),
            DisplayOrder = input.DisplayOrder ?? int.MaxValue,
            IsRequired = input.Required,
            ShowWhenExpression = input.ShowWhenExpression,
            AnswerOptions = input.Options.Select(option => new IntakeQuestionOptionDto
            {
                Value = option.Value,
                Label = option.Label
            }).ToList()
        };
    }

    private static List<PathwayRuleTraceDto> MapRuleTrace(IEnumerable<PathwayRuleTraceItem> ruleTrace)
    {
        return ruleTrace.Select(item => new PathwayRuleTraceDto
        {
            RuleId = item.RuleId,
            Label = item.Label,
            Triggered = item.Triggered,
            EffectsSummary = item.EffectsSummary
        }).ToList();
    }

    private static string MapInputType(string type)
    {
        return type?.ToLowerInvariant() switch
        {
            "boolean" => "Boolean",
            "single_select" => "SingleSelect",
            "multiselect" => "MultiSelect",
            "multi_select" => "MultiSelect",
            "number" => "Number",
            "text" => "Text",
            _ => "Text"
        };
    }

    private static PathwayClassificationCandidateDto MapClassificationCandidate(PathwayClassificationCandidate candidate)
    {
        return new PathwayClassificationCandidateDto
        {
            PathwayId = candidate.PathwayId,
            TotalScore = candidate.TotalScore,
            ConfidenceBand = candidate.ConfidenceBand.ToString(),
            MatchedSignals = candidate.MatchedSignals.Select(item => new PathwayClassificationSignalDto
            {
                SignalType = item.SignalType,
                MatchedTerm = item.MatchedTerm,
                Weight = item.Weight
            }).ToList()
        };
    }
}
