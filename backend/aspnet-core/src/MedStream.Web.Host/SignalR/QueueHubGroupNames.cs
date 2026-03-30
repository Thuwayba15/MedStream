namespace MedStream.Web.Host.SignalR
{
    internal static class QueueHubGroupNames
    {
        public static string Facility(int facilityId)
        {
            return $"queue-facility-{facilityId}";
        }

        public static string Patient(long patientUserId)
        {
            return $"queue-patient-{patientUserId}";
        }
    }
}
