using MedStream.QueueOperations;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace MedStream.Web.Host.SignalR
{
    public class QueueRealtimeNotifier : IQueueRealtimeNotifier
    {
        private readonly IHubContext<QueueHub> _hubContext;

        public QueueRealtimeNotifier(IHubContext<QueueHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task NotifyFacilityQueueChangedAsync(int facilityId)
        {
            return _hubContext.Clients.Group(QueueHubGroupNames.Facility(facilityId)).SendAsync(
                "queueUpdated",
                new
                {
                    scope = "facility",
                    facilityId
                });
        }

        public Task NotifyPatientQueueChangedAsync(long patientUserId, long visitId, long queueTicketId)
        {
            return _hubContext.Clients.Group(QueueHubGroupNames.Patient(patientUserId)).SendAsync(
                "queueUpdated",
                new
                {
                    scope = "patient",
                    patientUserId,
                    visitId,
                    queueTicketId
                });
        }
    }
}
