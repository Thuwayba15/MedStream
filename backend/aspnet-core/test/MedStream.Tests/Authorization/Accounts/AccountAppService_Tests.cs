using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Runtime.Validation;
using Abp.MultiTenancy;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.Users;
using MedStream.Users.Dto;
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
        var facilityId = await GetFacilityIdAsync("Thembisa Hospital");
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
            RequestedFacilityId = facilityId
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
        var facilityId = await GetFacilityIdAsync("Soweto Community Health Centre");
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
            RequestedFacilityId = facilityId
        });

        var userId = await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.EmailAddress == emailAddress);
            return user.Id;
        });

        await _userAppService.ApproveClinician(new ClinicianApprovalDecisionInput
        {
            Id = userId,
            DecisionReason = "Credentials verified."
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.Id == userId);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeFalse();
            user.ClinicianApprovedAt.ShouldNotBeNull();
            user.ApprovalDecisionReason.ShouldBe("Credentials verified.");
            roles.ShouldContain(StaticRoleNames.Tenants.Clinician);
            roles.ShouldNotContain(StaticRoleNames.Tenants.Patient);
        });
    }

    [Fact]
    public async Task Approve_Clinician_Should_Require_Approval_Permission()
    {
        var clinicianEmailAddress = $"approval-target-{Guid.NewGuid():N}@medstream.test";
        var facilityId = await GetFacilityIdAsync("Steve Biko Academic Hospital");
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
            RequestedFacilityId = facilityId
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
            await _userAppService.ApproveClinician(new ClinicianApprovalDecisionInput
            {
                Id = clinicianUserId,
                DecisionReason = "Permission test"
            }));

        LoginAsDefaultTenantAdmin();
    }

    [Fact]
    public async Task Decline_Clinician_Should_Mark_Rejected_And_Deactivate()
    {
        var emailAddress = $"decline-{Guid.NewGuid():N}@medstream.test";
        var facilityId = await GetFacilityIdAsync("Soweto Community Health Centre");
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Decline",
            LastName = "Target",
            EmailAddress = emailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-9999",
            RequestedFacilityId = facilityId
        });

        var userId = await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.EmailAddress == emailAddress);
            return user.Id;
        });

        await _userAppService.DeclineClinician(new ClinicianApprovalDecisionInput
        {
            Id = userId,
            DecisionReason = "Registration details could not be verified."
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(x => x.Id == userId);
            var roles = await _userManager.GetRolesAsync(user);

            user.IsClinicianApprovalPending.ShouldBeFalse();
            user.IsActive.ShouldBeFalse();
            user.ApprovalStatus.ShouldBe(UserRegistrationConstants.ApprovalStatusRejected);
            user.ApprovalDecisionReason.ShouldBe("Registration details could not be verified.");
            user.ClinicianDeclinedAt.ShouldNotBeNull();
            roles.ShouldNotContain(StaticRoleNames.Tenants.Clinician);
        });
    }

    [Fact]
    public async Task Register_Should_Reject_Duplicate_Email_Address()
    {
        var emailAddress = $"duplicate-email-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Original",
            LastName = "User",
            EmailAddress = emailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        var exception = await Should.ThrowAsync<AbpValidationException>(async () =>
            await _accountAppService.Register(new RegisterInput
            {
                FirstName = "Duplicate",
                LastName = "User",
                EmailAddress = emailAddress,
                PhoneNumber = "0634113457",
                Password = "Password1",
                ConfirmPassword = "Password1",
                AccountType = "Patient"
            }));

        exception.ValidationErrors.ShouldContain(error => error.ErrorMessage == "An account with this email address already exists.");
    }

    [Fact]
    public async Task Register_Should_Reject_Duplicate_Id_Number()
    {
        var originalEmailAddress = $"duplicate-id-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Original",
            LastName = "Patient",
            EmailAddress = originalEmailAddress,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient",
            IdNumber = "9001015009087"
        });

        var exception = await Should.ThrowAsync<AbpValidationException>(async () =>
            await _accountAppService.Register(new RegisterInput
            {
                FirstName = "Duplicate",
                LastName = "Clinician",
                EmailAddress = $"duplicate-id-target-{Guid.NewGuid():N}@medstream.test",
                PhoneNumber = "0634113458",
                Password = "Password1",
                ConfirmPassword = "Password1",
                AccountType = "Clinician",
                IdNumber = "9001015009087",
                ProfessionType = "Doctor",
                RegulatoryBody = "HPCSA",
                RegistrationNumber = "HPCSA-DUP-ID",
                RequestedFacilityId = await GetFacilityIdAsync("Thembisa Hospital")
            }));

        exception.ValidationErrors.ShouldContain(error => error.ErrorMessage == "An account with this ID number already exists.");
    }

    [Fact]
    public async Task Register_Should_Reject_Duplicate_Clinician_Registration_Number()
    {
        var facilityId = await GetFacilityIdAsync("Soweto Community Health Centre");
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Original",
            LastName = "Clinician",
            EmailAddress = $"duplicate-reg-{Guid.NewGuid():N}@medstream.test",
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-UNIQUE-1",
            RequestedFacilityId = facilityId
        });

        var exception = await Should.ThrowAsync<AbpValidationException>(async () =>
            await _accountAppService.Register(new RegisterInput
            {
                FirstName = "Duplicate",
                LastName = "Clinician",
                EmailAddress = $"duplicate-reg-target-{Guid.NewGuid():N}@medstream.test",
                PhoneNumber = "0634113459",
                Password = "Password1",
                ConfirmPassword = "Password1",
                AccountType = "Clinician",
                IdNumber = "9101015009088",
                ProfessionType = "Doctor",
                RegulatoryBody = "HPCSA",
                RegistrationNumber = "HPCSA-UNIQUE-1",
                RequestedFacilityId = facilityId
            }));

        exception.ValidationErrors.ShouldContain(error => error.ErrorMessage == "A clinician with this registration number already exists.");
    }

    private async Task<int> GetFacilityIdAsync(string name)
    {
        return await UsingDbContextAsync(async context =>
        {
            var facility = await context.Set<Facility>().FirstAsync(item => item.Name == name);
            return facility.Id;
        });
    }
}
