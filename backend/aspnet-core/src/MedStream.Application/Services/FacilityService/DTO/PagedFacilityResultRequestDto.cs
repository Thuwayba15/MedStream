using Abp.Application.Services.Dto;

namespace MedStream.Facilities.Dto;

/// <summary>
/// Request for paged facility retrieval.
/// </summary>
public class PagedFacilityResultRequestDto : PagedAndSortedResultRequestDto
{
    /// <summary>
    /// Gets or sets an optional free-text search keyword.
    /// </summary>
    public string Keyword { get; set; }

    /// <summary>
    /// Gets or sets an optional active-state filter.
    /// </summary>
    public bool? IsActive { get; set; }

    public PagedFacilityResultRequestDto()
    {
        Sorting = "Name asc";
    }
}
