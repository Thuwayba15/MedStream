using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.Domain.Services;
using Abp.IdentityFramework;
using Abp.Runtime.Session;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.MultiTenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Authorization.Users;

public class UserRegistrationManager : DomainService
{
    public IAbpSession AbpSession { get; set; }

    private readonly IRepository<Tenant, int> _tenantRepository;
    private readonly UserManager _userManager;
    private readonly RoleManager _roleManager;

    public UserRegistrationManager(
        IRepository<Tenant, int> tenantRepository,
        UserManager userManager,
        RoleManager roleManager)
    {
        _tenantRepository = tenantRepository;
        _userManager = userManager;
        _roleManager = roleManager;

        AbpSession = NullAbpSession.Instance;
    }

    public async Task<User> RegisterAsync(string name, string surname, string emailAddress, string userName, string plainPassword, bool isEmailConfirmed)
    {
        return await RegisterAsync(name, surname, emailAddress, userName, plainPassword, isEmailConfirmed, null);
    }

    public async Task<User> RegisterAsync(string name, string surname, string emailAddress, string userName, string plainPassword, bool isEmailConfirmed, int? tenantId)
    {
        var resolvedTenantId = ResolveTenantId(tenantId);
        var tenant = await GetActiveTenantAsync(resolvedTenantId);

        var user = new User
        {
            TenantId = tenant.Id,
            Name = name,
            Surname = surname,
            EmailAddress = emailAddress,
            IsActive = true,
            UserName = userName,
            IsEmailConfirmed = isEmailConfirmed,
            Roles = new List<UserRole>()
        };

        user.SetNormalizedNames();

        foreach (var defaultRole in await _roleManager.Roles.Where(role => role.IsDefault).ToListAsync())
        {
            user.Roles.Add(new UserRole(tenant.Id, user.Id, defaultRole.Id));
        }

        await _userManager.InitializeOptionsAsync(tenant.Id);

        CheckErrors(await _userManager.CreateAsync(user, plainPassword));
        await CurrentUnitOfWork.SaveChangesAsync();

        return user;
    }

    private int ResolveTenantId(int? tenantId)
    {
        if (tenantId.HasValue)
        {
            return tenantId.Value;
        }

        if (AbpSession.TenantId.HasValue)
        {
            return AbpSession.TenantId.Value;
        }

        throw new InvalidOperationException("Can not register host users!");
    }

    private async Task<Tenant> GetActiveTenantAsync(int tenantId)
    {
        // Query tenant directly to avoid failures caused by stale audit user references.
        var tenant = await _tenantRepository.FirstOrDefaultAsync(tenantId);
        if (tenant == null)
        {
            throw new UserFriendlyException(L("UnknownTenantId{0}", tenantId));
        }

        if (!tenant.IsActive)
        {
            throw new UserFriendlyException(L("TenantIdIsNotActive{0}", tenantId));
        }

        return tenant;
    }

    protected virtual void CheckErrors(IdentityResult identityResult)
    {
        identityResult.CheckErrors(LocalizationManager);
    }
}
