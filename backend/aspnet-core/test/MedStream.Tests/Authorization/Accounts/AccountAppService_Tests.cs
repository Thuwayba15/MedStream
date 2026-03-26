using Abp.Application.Services.Dto;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Users;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.Authorization.Accounts;

public class AccountAppService_Tests : MedStreamTestBase
{
    private readonly IAccountAppService _accountAppService;
    private readonly IUserAppService _userAppService;
    private readonly UserManager _userManager;

    public AccountAppService_Tests()
    {
        _accountAppService = Resolve<IAccountAppService>();
        _userAppService = Resolve<IUserAppService>();
        _userManager = Resolve<UserManager>();
    }

    [Fact]
    public async Task Register_Patient_Should_Assign_Patient_Role_Immediately()
    {
        var username = $"patient-{Guid.NewGuid():N}".Substring(0, 20);
        await _accountAppService.Register(new RegisterInput
        {
            Name = "Test",
            Surname = "Patient",
            EmailAddress = $"{username}@medstream.test",
            UserName = username,
            Password = "Password1",
            RegistrationRole = StaticRoleNames.Tenants.Patient
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.UserName == username);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeFalse();
            roles.ShouldContain(StaticRoleNames.Tenants.Patient);
            roles.ShouldNotContain(StaticRoleNames.Tenants.Clinician);
        });
    }

    [Fact]
    public async Task Register_Clinician_Should_Be_Pending_Without_Clinician_Role()
    {
        var username = $"clinician-{Guid.NewGuid():N}".Substring(0, 22);
        await _accountAppService.Register(new RegisterInput
        {
            Name = "Test",
            Surname = "Clinician",
            EmailAddress = $"{username}@medstream.test",
            UserName = username,
            Password = "Password1",
            RegistrationRole = StaticRoleNames.Tenants.Clinician
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.UserName == username);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeTrue();
            roles.ShouldNotContain(StaticRoleNames.Tenants.Clinician);
        });
    }

    [Fact]
    public async Task Approve_Clinician_Should_Assign_Clinician_Role_And_Clear_Pending()
    {
        var username = $"approve-{Guid.NewGuid():N}".Substring(0, 20);
        await _accountAppService.Register(new RegisterInput
        {
            Name = "Approve",
            Surname = "Flow",
            EmailAddress = $"{username}@medstream.test",
            UserName = username,
            Password = "Password1",
            RegistrationRole = StaticRoleNames.Tenants.Clinician
        });

        var userId = await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.UserName == username);
            return user.Id;
        });

        await _userAppService.ApproveClinician(new EntityDto<long>(userId));

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.Id == userId);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeFalse();
            user.ClinicianApprovedAt.ShouldNotBeNull();
            roles.ShouldContain(StaticRoleNames.Tenants.Clinician);
            roles.ShouldNotContain(StaticRoleNames.Tenants.Patient);
        });
    }
}
