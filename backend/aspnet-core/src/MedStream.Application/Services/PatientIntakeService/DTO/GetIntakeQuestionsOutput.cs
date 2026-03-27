using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Response payload for dynamic intake question retrieval.
/// </summary>
public class GetIntakeQuestionsOutput
{
    /// <summary>
    /// Gets or sets ordered question set.
    /// </summary>
    public List<IntakeQuestionDto> QuestionSet { get; set; } = new();
}
