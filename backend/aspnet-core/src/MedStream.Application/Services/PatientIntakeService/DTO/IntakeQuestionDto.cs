using System.Collections.Generic;

namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Represents a dynamic intake question.
/// </summary>
public class IntakeQuestionDto
{
    /// <summary>
    /// Gets or sets stable question key.
    /// </summary>
    public string QuestionKey { get; set; }

    /// <summary>
    /// Gets or sets display question text.
    /// </summary>
    public string QuestionText { get; set; }

    /// <summary>
    /// Gets or sets input type name.
    /// </summary>
    public string InputType { get; set; }

    /// <summary>
    /// Gets or sets display order index.
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Gets or sets whether answer is required.
    /// </summary>
    public bool IsRequired { get; set; }

    /// <summary>
    /// Gets or sets answer option list.
    /// </summary>
    public List<IntakeQuestionOptionDto> AnswerOptions { get; set; } = new();

    /// <summary>
    /// Gets or sets optional conditional visibility expression.
    /// </summary>
    public string ShowWhenExpression { get; set; }
}
