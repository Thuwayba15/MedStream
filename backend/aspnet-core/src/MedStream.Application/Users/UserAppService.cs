using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.Domain.Entities;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.IdentityFramework;
using Abp.Linq.Extensions;
using Abp.Localization;
using Abp.Runtime.Session;
using Abp.UI;
using MedStream.Authorization;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Roles.Dto;
using MedStream.Users.Dto;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace MedStream.Users;

[AbpAuthorize(PermissionNames.Pages_Users)]
public class UserAppService : AsyncCrudAppService<User, UserDto, long, PagedUserResultRequestDto, CreateUserDto, UserDto>, IUserAppService
{
    private readonly UserManager _userManager;
    private readonly RoleManager _roleManager;
    private readonly IRepository<Role> _roleRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IAbpSession _abpSession;
    private readonly LogInManager _logInManager;

    public UserAppService(
        IRepository<User, long> repository,
        UserManager userManager,
        RoleManager roleManager,
        IRepository<Role> roleRepository,
        IPasswordHasher<User> passwordHasher,
        IAbpSession abpSession,
        LogInManager logInManager)
        : base(repository)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _abpSession = abpSession;
        _logInManager = logInManager;
    }

    public override async Task<UserDto> CreateAsync(CreateUserDto input)
    {
        CheckCreatePermission();

        var user = ObjectMapper.Map<User>(input);

        user.TenantId = AbpSession.TenantId;
        user.IsEmailConfirmed = true;

        await _userManager.InitializeOptionsAsync(AbpSession.TenantId);

        CheckErrors(await _userManager.CreateAsync(user, input.Password));

        if (input.RoleNames != null)
        {
            CheckErrors(await _userManager.SetRolesAsync(user, input.RoleNames));
        }

        CurrentUnitOfWork.SaveChanges();

        return MapToEntityDto(user);
    }

    public override async Task<UserDto> UpdateAsync(UserDto input)
    {
        CheckUpdatePermission();

        var user = await _userManager.GetUserByIdAsync(input.Id);

        MapToEntity(input, user);

        CheckErrors(await _userManager.UpdateAsync(user));

        if (input.RoleNames != null)
        {
            CheckErrors(await _userManager.SetRolesAsync(user, input.RoleNames));
        }

        return await GetAsync(input);
    }

    public override async Task DeleteAsync(EntityDto<long> input)
    {
        var user = await _userManager.GetUserByIdAsync(input.Id);
        await _userManager.DeleteAsync(user);
    }

    [AbpAuthorize(PermissionNames.Pages_Users_Activation)]
    public async Task Activate(EntityDto<long> user)
    {
        await Repository.UpdateAsync(user.Id, async (entity) =>
        {
            entity.IsActive = true;
        });
    }

    [AbpAuthorize(PermissionNames.Pages_Users_Activation)]
    public async Task DeActivate(EntityDto<long> user)
    {
        await Repository.UpdateAsync(user.Id, async (entity) =>
        {
            entity.IsActive = false;
        });
    }

    public async Task<ListResultDto<RoleDto>> GetRoles()
    {
        var roles = await _roleRepository.GetAllListAsync();
        return new ListResultDto<RoleDto>(ObjectMapper.Map<List<RoleDto>>(roles));
    }

    [AbpAuthorize(PermissionNames.Pages_Users_Approvals_View)]
    public async Task<ListResultDto<UserDto>> GetClinicianApplicants()
    {
        var clinicianApplicants = await Repository.GetAllIncluding(entity => entity.Roles)
            .Where(entity => entity.RequestedRegistrationRole == StaticRoleNames.Tenants.Clinician)
            .OrderByDescending(entity => entity.ClinicianSubmittedAt ?? entity.CreationTime)
            .ToListAsync();

        var userDtos = clinicianApplicants.Select(MapToEntityDto).ToList();
        return new ListResultDto<UserDto>(userDtos);
    }

    public async Task ChangeLanguage(ChangeUserLanguageDto input)
    {
        await SettingManager.ChangeSettingForUserAsync(
            AbpSession.ToUserIdentifier(),
            LocalizationSettingNames.DefaultLanguage,
            input.LanguageName
        );
    }

    protected override User MapToEntity(CreateUserDto createInput)
    {
        var user = ObjectMapper.Map<User>(createInput);
        user.SetNormalizedNames();
        return user;
    }

    protected override void MapToEntity(UserDto input, User user)
    {
        ObjectMapper.Map(input, user);
        user.SetNormalizedNames();
    }

    protected override UserDto MapToEntityDto(User user)
    {
        var roleIds = user.Roles.Select(x => x.RoleId).ToArray();

        var roles = _roleManager.Roles.Where(r => roleIds.Contains(r.Id)).Select(r => r.Name);

        var userDto = base.MapToEntityDto(user);
        userDto.RoleNames = roles.ToArray();

        return userDto;
    }

    protected override IQueryable<User> CreateFilteredQuery(PagedUserResultRequestDto input)
    {
        return Repository.GetAllIncluding(x => x.Roles)
            .WhereIf(!input.Keyword.IsNullOrWhiteSpace(), x => x.UserName.Contains(input.Keyword) || x.Name.Contains(input.Keyword) || x.EmailAddress.Contains(input.Keyword))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);
    }

    protected override async Task<User> GetEntityByIdAsync(long id)
    {
        var user = await Repository.GetAllIncluding(x => x.Roles).FirstOrDefaultAsync(x => x.Id == id);

        if (user == null)
        {
            throw new EntityNotFoundException(typeof(User), id);
        }

        return user;
    }

    protected override IQueryable<User> ApplySorting(IQueryable<User> query, PagedUserResultRequestDto input)
    {
        return query.OrderBy(input.Sorting);
    }

    protected virtual void CheckErrors(IdentityResult identityResult)
    {
        identityResult.CheckErrors(LocalizationManager);
    }

    public async Task<bool> ChangePassword(ChangePasswordDto input)
    {
        await _userManager.InitializeOptionsAsync(AbpSession.TenantId);

        var user = await _userManager.FindByIdAsync(AbpSession.GetUserId().ToString());
        if (user == null)
        {
            throw new Exception("There is no current user!");
        }

        if (await _userManager.CheckPasswordAsync(user, input.CurrentPassword))
        {
            CheckErrors(await _userManager.ChangePasswordAsync(user, input.NewPassword));
        }
        else
        {
            CheckErrors(IdentityResult.Failed(new IdentityError
            {
                Description = "Incorrect password."
            }));
        }

        return true;
    }

    public async Task<bool> ResetPassword(ResetPasswordDto input)
    {
        if (_abpSession.UserId == null)
        {
            throw new UserFriendlyException("Please log in before attempting to reset password.");
        }

        var currentUser = await _userManager.GetUserByIdAsync(_abpSession.GetUserId());
        var loginAsync = await _logInManager.LoginAsync(currentUser.UserName, input.AdminPassword, shouldLockout: false);
        if (loginAsync.Result != AbpLoginResultType.Success)
        {
            throw new UserFriendlyException("Your 'Admin Password' did not match the one on record.  Please try again.");
        }

        if (currentUser.IsDeleted || !currentUser.IsActive)
        {
            return false;
        }

        var roles = await _userManager.GetRolesAsync(currentUser);
        if (!roles.Contains(StaticRoleNames.Tenants.Admin))
        {
            throw new UserFriendlyException("Only administrators may reset passwords.");
        }

        var user = await _userManager.GetUserByIdAsync(input.UserId);
        if (user != null)
        {
            user.Password = _passwordHasher.HashPassword(user, input.NewPassword);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        return true;
    }

    [AbpAuthorize(PermissionNames.Pages_Users_Approvals_Approve)]
    public async Task<UserDto> ApproveClinician(EntityDto<long> input)
    {
        var user = await Repository.GetAllIncluding(entity => entity.Roles).FirstOrDefaultAsync(entity => entity.Id == input.Id);
        if (user == null)
        {
            throw new EntityNotFoundException(typeof(User), input.Id);
        }

        if (!string.Equals(user.RequestedRegistrationRole, StaticRoleNames.Tenants.Clinician, StringComparison.Ordinal))
        {
            throw new UserFriendlyException("Only clinician applicants can be approved.");
        }

        if (!user.IsClinicianApprovalPending)
        {
            throw new UserFriendlyException("Clinician approval is not pending for this user.");
        }

        var tenantId = user.TenantId ?? 1;
        var patientRole = await GetOrCreateTenantRoleAsync(tenantId, StaticRoleNames.Tenants.Patient);
        var clinicianRole = await GetOrCreateTenantRoleAsync(tenantId, StaticRoleNames.Tenants.Clinician);

        var patientMapping = user.Roles.FirstOrDefault(role => role.RoleId == patientRole.Id);
        if (patientMapping != null)
        {
            user.Roles.Remove(patientMapping);
        }

        if (!user.Roles.Any(role => role.RoleId == clinicianRole.Id))
        {
            user.Roles.Add(new UserRole(tenantId, user.Id, clinicianRole.Id));
        }

        user.IsClinicianApprovalPending = false;
        user.ClinicianApprovedAt = DateTime.UtcNow;
        user.ClinicianApprovedByUserId = AbpSession.UserId;
        user.ApprovalStatus = UserRegistrationConstants.ApprovalStatusApproved;
        user.AccountType = UserRegistrationConstants.AccountTypeClinician;

        CheckErrors(await _userManager.UpdateAsync(user));
        await CurrentUnitOfWork.SaveChangesAsync();

        return await GetAsync(new EntityDto<long>(input.Id));
    }

    private async Task<Role> GetOrCreateTenantRoleAsync(int tenantId, string roleName)
    {
        var normalizedRoleName = roleName.ToUpperInvariant();
        var existingRole = await _roleRepository.FirstOrDefaultAsync(role =>
            role.TenantId == tenantId && role.NormalizedName == normalizedRoleName);
        if (existingRole != null)
        {
            return existingRole;
        }

        var role = new Role(tenantId, roleName, roleName)
        {
            IsStatic = true,
            IsDefault = false
        };
        role.NormalizedName = normalizedRoleName;

        CheckErrors(await _roleManager.CreateAsync(role));
        return role;
    }
}

