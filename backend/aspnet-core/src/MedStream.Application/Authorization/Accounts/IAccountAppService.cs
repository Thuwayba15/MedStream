using Abp.Application.Services;
using MedStream.Authorization.Accounts.Dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MedStream.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<RegisterOutput> Register(RegisterInput input);

    Task<List<RegistrationFacilityDto>> GetActiveFacilities();
}
