using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.Consultation;

public partial class ConsultationDraftGenerator
{
    private static ConsultationDraftResult BuildFallbackSubjective(ConsultationDraftContext context)
    {
        var transcriptSummary = string.Join(" ", context.TranscriptSegments
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Take(3));
        var cleanedIntakeSubjective = CleanNarrative(context.IntakeSubjective);
        var cleanedCurrentSubjective = CleanNarrative(context.CurrentSubjective);
        var transcriptHighlights = ExtractNarrativeHighlights(CleanNarrative(transcriptSummary))
            .Select(NormalizeClinicalPhrase)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();
        var intakeParagraph = BuildSubjectiveNarrative(cleanedCurrentSubjective, cleanedIntakeSubjective);
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(intakeParagraph))
        {
            parts.Add(intakeParagraph);
        }

        if (transcriptHighlights.Count > 0)
        {
            parts.Add($"During consultation, the patient additionally reported {JoinWithAnd(transcriptHighlights).ToLowerInvariant()}.");
        }

        return new ConsultationDraftResult
        {
            Source = "deterministic-fallback",
            Summary = "Merged intake handoff with available consultation transcript context.",
            Subjective = string.Join("\n\n", parts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim()
        };
    }
}
