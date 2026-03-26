using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.Linq.Extensions;
using Abp.UI;
using MedStream.Authorization;
using MedStream.Authorization.Users;
using MedStream.Facilities.Dto;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace MedStream.Facilities;

/// <summary>
/// Admin-facing application service for facility governance.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Facilities)]
public class FacilityAppService : AsyncCrudAppService<Facility, FacilityDto, int, PagedFacilityResultRequestDto, CreateUpdateFacilityDto, UpdateFacilityDto>, IFacilityAppService
{
    private readonly IRepository<User, long> _userRepository;

    public FacilityAppService(IRepository<Facility, int> repository, IRepository<User, long> userRepository)
        : base(repository)
    {
        _userRepository = userRepository;
    }

    /// <inheritdoc />
    [AbpAuthorize(PermissionNames.Pages_Facilities_Activation)]
    public async Task<FacilityDto> SetActivation(SetFacilityActivationInput input)
    {
        var facility = await Repository.GetAsync(input.Id);
        facility.IsActive = input.IsActive;
        await Repository.UpdateAsync(facility);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapToEntityDto(facility);
    }

    /// <inheritdoc />
    [AbpAuthorize(PermissionNames.Pages_Facilities_AssignClinician)]
    public async Task AssignClinician(AssignClinicianFacilityInput input)
    {
        var facility = await Repository.GetAsync(input.FacilityId);
        if (!facility.IsActive)
        {
            throw new UserFriendlyException("Clinicians can only be assigned to active facilities.");
        }

        var user = await _userRepository.GetAsync(input.ClinicianUserId);
        if (!string.Equals(user.AccountType, UserRegistrationConstants.AccountTypeClinician, System.StringComparison.Ordinal))
        {
            throw new UserFriendlyException("Only clinician users can be assigned to facilities.");
        }

        user.ClinicianFacilityId = facility.Id;
        user.RequestedFacility = facility.Name;
        await _userRepository.UpdateAsync(user);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    /// <inheritdoc />
    [AbpAuthorize(PermissionNames.Pages_Facilities_View)]
    public async Task<ListResultDto<FacilityDto>> GetActiveList()
    {
        var facilities = await Repository.GetAll()
            .Where(item => item.IsActive)
            .OrderBy(item => item.Name)
            .ToListAsync();

        return new ListResultDto<FacilityDto>(facilities.Select(MapToEntityDto).ToList());
    }

    protected override IQueryable<Facility> CreateFilteredQuery(PagedFacilityResultRequestDto input)
    {
        return Repository.GetAll()
            .WhereIf(!input.Keyword.IsNullOrWhiteSpace(), item =>
                item.Name.Contains(input.Keyword) ||
                item.Code.Contains(input.Keyword) ||
                item.Province.Contains(input.Keyword) ||
                item.District.Contains(input.Keyword))
            .WhereIf(input.IsActive.HasValue, item => item.IsActive == input.IsActive.Value);
    }

    protected override void CheckCreatePermission()
    {
        PermissionChecker.Authorize(PermissionNames.Pages_Facilities_Create);
    }

    protected override void CheckUpdatePermission()
    {
        PermissionChecker.Authorize(PermissionNames.Pages_Facilities_Edit);
    }

    protected override void CheckDeletePermission()
    {
        PermissionChecker.Authorize(PermissionNames.Pages_Facilities_Edit);
    }

    protected override void CheckGetPermission()
    {
        PermissionChecker.Authorize(PermissionNames.Pages_Facilities_View);
    }

    protected override void CheckGetAllPermission()
    {
        PermissionChecker.Authorize(PermissionNames.Pages_Facilities_View);
    }

    protected override IQueryable<Facility> ApplySorting(IQueryable<Facility> query, PagedFacilityResultRequestDto input)
    {
        return query.OrderBy(input.Sorting ?? "Name asc");
    }

    protected override Facility MapToEntity(CreateUpdateFacilityDto createInput)
    {
        ValidateGovernanceInput(createInput);
        return new Facility
        {
            Name = createInput.Name?.Trim(),
            Code = createInput.Code?.Trim(),
            FacilityType = createInput.FacilityType?.Trim(),
            Province = createInput.Province?.Trim(),
            District = createInput.District?.Trim(),
            Address = createInput.Address?.Trim(),
            IsActive = createInput.IsActive
        };
    }

    protected override void MapToEntity(UpdateFacilityDto updateInput, Facility entity)
    {
        ValidateGovernanceInput(updateInput);
        entity.Name = updateInput.Name?.Trim();
        entity.Code = updateInput.Code?.Trim();
        entity.FacilityType = updateInput.FacilityType?.Trim();
        entity.Province = updateInput.Province?.Trim();
        entity.District = updateInput.District?.Trim();
        entity.Address = updateInput.Address?.Trim();
        entity.IsActive = updateInput.IsActive;
    }

    private static void ValidateGovernanceInput(CreateUpdateFacilityDto input)
    {
        if (!input.FacilityType.IsNullOrWhiteSpace() && !FacilityConstants.SupportedFacilityTypes.Contains(input.FacilityType))
        {
            throw new UserFriendlyException("Facility type must be selected from the supported list.");
        }

        if (!input.Province.IsNullOrWhiteSpace() && !FacilityConstants.SupportedProvinces.Contains(input.Province))
        {
            throw new UserFriendlyException("Province must be selected from the supported South African province list.");
        }
    }
}
