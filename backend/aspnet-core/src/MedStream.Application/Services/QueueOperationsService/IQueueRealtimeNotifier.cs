using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Publishes realtime queue change notifications to connected clients.
/// </summary>
public interface IQueueRealtimeNotifier
{
    /// <summary>
    /// Notifies facility listeners that the live queue changed.
    /// </summary>
    Task NotifyFacilityQueueChangedAsync(int facilityId);

    /// <summary>
    /// Notifies the patient listener that their queue state changed.
    /// </summary>
    Task NotifyPatientQueueChangedAsync(long patientUserId, long visitId, long queueTicketId);
}
