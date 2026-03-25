using Abp.Application.Services;
using MedStream.Sessions.Dto;
using System.Threading.Tasks;

namespace MedStream.Sessions;

public interface ISessionAppService : IApplicationService
{
    Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
}
