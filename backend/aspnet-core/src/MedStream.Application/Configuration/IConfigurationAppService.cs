using MedStream.Configuration.Dto;
using System.Threading.Tasks;

namespace MedStream.Configuration;

public interface IConfigurationAppService
{
    Task ChangeUiTheme(ChangeUiThemeInput input);
}
