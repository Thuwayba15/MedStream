using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.MultiTenancy;
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
        var emailAddress = $"patient-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Test",
            LastName = "Patient",
            EmailAddress = emailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.EmailAddress == emailAddress);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeFalse();
            roles.ShouldContain(StaticRoleNames.Tenants.Patient);
            roles.ShouldNotContain(StaticRoleNames.Tenants.Clinician);
        });
    }

    [Fact]
    public async Task Register_Clinician_Should_Be_Pending_Without_Clinician_Role()
    {
        var emailAddress = $"clinician-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Test",
            LastName = "Clinician",
            EmailAddress = emailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-1234",
            RequestedFacility = "Johannesburg Clinic"
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.EmailAddress == emailAddress);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeTrue();
            roles.ShouldNotContain(StaticRoleNames.Tenants.Clinician);
        });
    }

    [Fact]
    public async Task Approve_Clinician_Should_Assign_Clinician_Role_And_Clear_Pending()
    {
        var emailAddress = $"approve-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Approve",
            LastName = "Flow",
            EmailAddress = emailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-5678",
            RequestedFacility = "Soweto Clinic"
        });

        var userId = await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.EmailAddress == emailAddress);
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

    [Fact]
    public async Task Approve_Clinician_Should_Require_Approval_Permission()
    {
        var clinicianEmailAddress = $"approval-target-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Pending",
            LastName = "Clinician",
            EmailAddress = clinicianEmailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-7777",
            RequestedFacility = "Pretoria Clinic"
        });

        var patientEmailAddress = $"patient-non-admin-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Patient",
            LastName = "User",
            EmailAddress = patientEmailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        var clinicianUserId = await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(entity => entity.EmailAddress == clinicianEmailAddress);
            return user.Id;
        });

        LoginAsTenant(AbpTenantBase.DefaultTenantName, patientEmailAddress);
        await Should.ThrowAsync<AbpAuthorizationException>(async () =>
            await _userAppService.ApproveClinician(new EntityDto<long>(clinicianUserId)));

        LoginAsDefaultTenantAdmin();
    }
}
