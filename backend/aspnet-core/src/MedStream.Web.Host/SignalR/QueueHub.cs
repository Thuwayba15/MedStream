using Abp.Authorization.Users;
using MedStream.Authorization.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Abp.Runtime.Security;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MedStream.Web.Host.SignalR
{
    [Authorize(AuthenticationSchemes = "JwtBearer")]
    public class QueueHub : Hub
    {
        public QueueHub()
        {
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                await base.OnConnectedAsync();
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, QueueHubGroupNames.Patient(userId.Value));

            var roleNames = Context.User?.FindAll(ClaimTypes.Role).Select(item => item.Value).ToList() ?? new System.Collections.Generic.List<string>();
            var approvalState = Context.User?.FindFirstValue(UserClaimTypes.ApprovalState);
            var clinicianFacilityId = Context.User?.FindFirstValue(UserClaimTypes.ClinicianFacilityId);

            if (roleNames.Contains("Clinician") &&
                string.Equals(approvalState, "approved", System.StringComparison.OrdinalIgnoreCase) &&
                int.TryParse(clinicianFacilityId, out var parsedFacilityId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, QueueHubGroupNames.Facility(parsedFacilityId));
            }

            await base.OnConnectedAsync();
        }

        private long? GetCurrentUserId()
        {
            var rawValue =
                Context.User?.FindFirstValue(AbpClaimTypes.UserId) ??
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

            return long.TryParse(rawValue, out var parsedUserId) ? (long?)parsedUserId : null;
        }
    }
}
