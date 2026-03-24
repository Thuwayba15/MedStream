using Abp.Authorization;
using Abp.Runtime.Session;
using MedStream.Configuration.Dto;
using System.Threading.Tasks;

namespace MedStream.Configuration;

[AbpAuthorize]
public class ConfigurationAppService : MedStreamAppServiceBase, IConfigurationAppService
{
    public async Task ChangeUiTheme(ChangeUiThemeInput input)
    {
        await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
    }
}
