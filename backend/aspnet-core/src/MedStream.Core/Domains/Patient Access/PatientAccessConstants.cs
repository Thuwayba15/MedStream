namespace MedStream.PatientAccess;

/// <summary>
/// Defines constants used by patient history access grants and audit records.
/// </summary>
public static class PatientAccessConstants
{
    /// <summary>
    /// Access type for viewing a patient timeline/history record.
    /// </summary>
    public const string AccessTypeTimelineRead = "timeline_read";

    /// <summary>
    /// Access reason when a clinician may view history through an assigned visit.
    /// </summary>
    public const string AccessReasonAssignedVisit = "assigned_visit";

    /// <summary>
    /// Access reason when a clinician may view history through an explicit active grant.
    /// </summary>
    public const string AccessReasonActiveGrant = "active_grant";
}
