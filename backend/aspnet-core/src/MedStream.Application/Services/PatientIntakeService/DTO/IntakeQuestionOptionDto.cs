namespace MedStream.PatientIntake.Dto;

/// <summary>
/// Represents a selectable option for a dynamic intake question.
/// </summary>
public class IntakeQuestionOptionDto
{
    /// <summary>
    /// Gets or sets underlying option value.
    /// </summary>
    public string Value { get; set; }

    /// <summary>
    /// Gets or sets display label.
    /// </summary>
    public string Label { get; set; }
}
