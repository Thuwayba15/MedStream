using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using MedStream.Authorization;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.EntityFrameworkCore.Seed.Tenants;

public class TenantRoleAndUserBuilder
{
    private readonly MedStreamDbContext _context;
    private readonly int _tenantId;

    public TenantRoleAndUserBuilder(MedStreamDbContext context, int tenantId)
    {
        _context = context;
        _tenantId = tenantId;
    }

    public void Create()
    {
        CreateRolesAndUsers();
    }

    private void CreateRolesAndUsers()
    {
        var adminRole = EnsureTenantRole(StaticRoleNames.Tenants.Admin);
        EnsureTenantRole(StaticRoleNames.Tenants.Patient);
        EnsureTenantRole(StaticRoleNames.Tenants.Clinician);
        EnsureDefaultFacilities();

        // Grant all permissions to admin role

        var grantedPermissions = _context.Permissions.IgnoreQueryFilters()
            .OfType<RolePermissionSetting>()
            .Where(p => p.TenantId == _tenantId && p.RoleId == adminRole.Id)
            .Select(p => p.Name)
            .ToList();

        var permissions = PermissionFinder
            .GetAllPermissions(new MedStreamAuthorizationProvider())
            .Where(p => p.MultiTenancySides.HasFlag(MultiTenancySides.Tenant) &&
                        !grantedPermissions.Contains(p.Name))
            .ToList();

        if (permissions.Any())
        {
            _context.Permissions.AddRange(
                permissions.Select(permission => new RolePermissionSetting
                {
                    TenantId = _tenantId,
                    Name = permission.Name,
                    IsGranted = true,
                    RoleId = adminRole.Id
                })
            );
            _context.SaveChanges();
        }

        // Admin user

        var adminUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == AbpUserBase.AdminUserName);
        if (adminUser == null)
        {
            adminUser = User.CreateTenantAdminUser(_tenantId, "admin@defaulttenant.com");
            adminUser.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions())).HashPassword(adminUser, "123qwe");
            adminUser.IsEmailConfirmed = true;
            adminUser.IsActive = true;

            _context.Users.Add(adminUser);
            _context.SaveChanges();

            // Assign Admin role to admin user
            _context.UserRoles.Add(new UserRole(_tenantId, adminUser.Id, adminRole.Id));
            _context.SaveChanges();
        }
    }

    private void EnsureDefaultFacilities()
    {
        var existingNames = _context.Set<Facility>()
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == _tenantId)
            .Select(item => item.Name)
            .ToHashSet();

        var defaults = new List<Facility>
        {
            new() { TenantId = _tenantId, Name = "Thembisa Hospital", Code = "THB", FacilityType = "Hospital", Province = "Gauteng", District = "Ekurhuleni", IsActive = true },
            new() { TenantId = _tenantId, Name = "Chris Hani Baragwanath Hospital", Code = "CHBH", FacilityType = "Hospital", Province = "Gauteng", District = "Johannesburg", IsActive = true },
            new() { TenantId = _tenantId, Name = "Soweto Community Health Centre", Code = "SOW-CHC", FacilityType = "CommunityHealthCentre", Province = "Gauteng", District = "Johannesburg", IsActive = true },
            new() { TenantId = _tenantId, Name = "Steve Biko Academic Hospital", Code = "SBAH", FacilityType = "Hospital", Province = "Gauteng", District = "Tshwane", IsActive = true }
        };

        var facilitiesToInsert = defaults.Where(item => !existingNames.Contains(item.Name)).ToList();
        if (facilitiesToInsert.Count == 0)
        {
            return;
        }

        _context.AddRange(facilitiesToInsert);
        _context.SaveChanges();
    }

    private Role EnsureTenantRole(string roleName)
    {
        var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == roleName);
        if (role != null)
        {
            return role;
        }

        role = _context.Roles.Add(new Role(_tenantId, roleName, roleName) { IsStatic = true }).Entity;
        _context.SaveChanges();
        return role;
    }
}
