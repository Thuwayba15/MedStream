using Abp.Application.Services;
using MedStream.MultiTenancy.Dto;

namespace MedStream.MultiTenancy;

public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
{
}

