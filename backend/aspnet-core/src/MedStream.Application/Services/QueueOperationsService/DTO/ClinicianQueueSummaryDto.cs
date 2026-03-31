namespace MedStream.QueueOperations.Dto;

/// <summary>
/// Summary metrics for the clinician queue dashboard.
/// </summary>
public class ClinicianQueueSummaryDto
{
    /// <summary>
    /// Gets or sets the number of patients currently waiting.
    /// </summary>
    public int WaitingCount { get; set; }

    /// <summary>
    /// Gets or sets the average waiting time for waiting patients.
    /// </summary>
    public int AverageWaitingMinutes { get; set; }

    /// <summary>
    /// Gets or sets the number of urgent active cases.
    /// </summary>
    public int UrgentCount { get; set; }

    /// <summary>
    /// Gets or sets the number of consultations seen today.
    /// </summary>
    public int SeenTodayCount { get; set; }

    /// <summary>
    /// Gets or sets the number of called cases.
    /// </summary>
    public int CalledCount { get; set; }

    /// <summary>
    /// Gets or sets the number of cases already in consultation.
    /// </summary>
    public int InConsultationCount { get; set; }
}
