namespace MedStream.Authorization.Accounts.Dto;

/// <summary>
/// Represents an active facility option used by registration forms.
/// </summary>
public class RegistrationFacilityDto
{
    /// <summary>
    /// Gets or sets the facility id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the facility name.
    /// </summary>
    public string Name { get; set; }
}
