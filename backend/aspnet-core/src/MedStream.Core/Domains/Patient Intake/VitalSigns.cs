using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.PatientIntake;

/// <summary>
/// Stores clinician-recorded vital signs for a visit.
/// </summary>
public class VitalSigns : FullAuditedEntity<long>, IMustHaveTenant
{
    /// <summary>
    /// Gets or sets the owning tenant id.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the related visit id.
    /// </summary>
    public long VisitId { get; set; }

    /// <summary>
    /// Gets or sets clinician user id that recorded the vital signs.
    /// </summary>
    public long RecordedByClinicianUserId { get; set; }

    /// <summary>
    /// Gets or sets the workflow phase for the measurement.
    /// </summary>
    [Required]
    [StringLength(32)]
    public string Phase { get; set; }

    /// <summary>
    /// Gets or sets whether this record is the latest visit snapshot.
    /// </summary>
    public bool IsLatest { get; set; }

    /// <summary>
    /// Gets or sets systolic blood pressure.
    /// </summary>
    public int? BloodPressureSystolic { get; set; }

    /// <summary>
    /// Gets or sets diastolic blood pressure.
    /// </summary>
    public int? BloodPressureDiastolic { get; set; }

    /// <summary>
    /// Gets or sets heart rate.
    /// </summary>
    public int? HeartRate { get; set; }

    /// <summary>
    /// Gets or sets respiratory rate.
    /// </summary>
    public int? RespiratoryRate { get; set; }

    /// <summary>
    /// Gets or sets body temperature in Celsius.
    /// </summary>
    public decimal? TemperatureCelsius { get; set; }

    /// <summary>
    /// Gets or sets oxygen saturation percentage.
    /// </summary>
    public int? OxygenSaturation { get; set; }

    /// <summary>
    /// Gets or sets blood glucose level.
    /// </summary>
    public decimal? BloodGlucose { get; set; }

    /// <summary>
    /// Gets or sets weight in kilograms.
    /// </summary>
    public decimal? WeightKg { get; set; }

    /// <summary>
    /// Gets or sets when the vitals were recorded.
    /// </summary>
    public DateTime RecordedAt { get; set; }
}
