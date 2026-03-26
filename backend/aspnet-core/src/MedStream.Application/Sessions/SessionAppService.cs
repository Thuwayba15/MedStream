using Abp.Auditing;
using MedStream.Authorization.Users;
using MedStream.Sessions.Dto;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Sessions;

public class SessionAppService : MedStreamAppServiceBase, ISessionAppService
{
    private readonly UserManager _userManager;

    public SessionAppService(UserManager userManager)
    {
        _userManager = userManager;
    }

    [DisableAuditing]
    public async Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations()
    {
        var output = new GetCurrentLoginInformationsOutput
        {
            Application = new ApplicationInfoDto
            {
                Version = AppVersionHelper.Version,
                ReleaseDate = AppVersionHelper.ReleaseDate,
                Features = new Dictionary<string, bool>()
            }
        };

        if (AbpSession.TenantId.HasValue)
        {
            output.Tenant = ObjectMapper.Map<TenantLoginInfoDto>(await GetCurrentTenantAsync());
        }

        if (AbpSession.UserId.HasValue)
        {
            var currentUser = await GetCurrentUserAsync();
            output.User = ObjectMapper.Map<UserLoginInfoDto>(currentUser);
            output.User.RoleNames = (await _userManager.GetRolesAsync(currentUser)).ToArray();
        }

        return output;
    }
}
