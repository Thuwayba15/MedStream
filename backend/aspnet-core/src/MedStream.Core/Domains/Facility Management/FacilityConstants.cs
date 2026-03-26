namespace MedStream.Facilities;

/// <summary>
/// Defines controlled values for facility governance fields in the South African context.
/// </summary>
public static class FacilityConstants
{
    /// <summary>
    /// Gets the supported facility type values.
    /// </summary>
    public static readonly string[] SupportedFacilityTypes =
    {
        "Clinic",
        "CommunityHealthCentre",
        "DistrictHospital",
        "RegionalHospital",
        "TertiaryHospital",
        "AcademicHospital"
    };

    /// <summary>
    /// Gets the supported South African province values.
    /// </summary>
    public static readonly string[] SupportedProvinces =
    {
        "Eastern Cape",
        "Free State",
        "Gauteng",
        "KwaZulu-Natal",
        "Limpopo",
        "Mpumalanga",
        "North West",
        "Northern Cape",
        "Western Cape"
    };
}
