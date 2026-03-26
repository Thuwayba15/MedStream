using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Facilities;

/// <summary>
/// Represents a healthcare facility managed by tenant administrators.
/// </summary>
public class Facility : FullAuditedEntity<int>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the human-readable facility name.
    /// </summary>
    [Required]
    [StringLength(128)]
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets an optional facility code.
    /// </summary>
    [StringLength(32)]
    public string Code { get; set; }

    /// <summary>
    /// Gets or sets the facility type label.
    /// </summary>
    [StringLength(64)]
    public string FacilityType { get; set; }

    /// <summary>
    /// Gets or sets the province where the facility is located.
    /// </summary>
    [StringLength(64)]
    public string Province { get; set; }

    /// <summary>
    /// Gets or sets the district where the facility is located.
    /// </summary>
    [StringLength(64)]
    public string District { get; set; }

    /// <summary>
    /// Gets or sets the full facility address.
    /// </summary>
    [StringLength(256)]
    public string Address { get; set; }

    /// <summary>
    /// Gets or sets whether the facility is active for operational use.
    /// </summary>
    public bool IsActive { get; set; } = true;
}
