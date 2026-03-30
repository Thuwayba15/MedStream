using System.Threading.Tasks;

namespace MedStream.QueueOperations;

public class NullQueueRealtimeNotifier : IQueueRealtimeNotifier
{
    public Task NotifyFacilityQueueChangedAsync(int facilityId)
    {
        return Task.CompletedTask;
    }

    public Task NotifyPatientQueueChangedAsync(long patientUserId, long visitId, long queueTicketId)
    {
        return Task.CompletedTask;
    }
}
