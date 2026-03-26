using Abp.Application.Services.Dto;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.Facilities.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Abp.Runtime.Validation;

namespace MedStream.Tests.Facilities;

public class FacilityAppService_Tests : MedStreamTestBase
{
    private readonly IFacilityAppService _facilityAppService;
    private readonly IAccountAppService _accountAppService;

    public FacilityAppService_Tests()
    {
        _facilityAppService = Resolve<IFacilityAppService>();
        _accountAppService = Resolve<IAccountAppService>();
    }

    [Fact]
    public async Task Create_And_Update_Should_Use_Supported_Type_And_Province()
    {
        var created = await _facilityAppService.CreateAsync(new CreateUpdateFacilityDto
        {
            Name = $"Facility-{Guid.NewGuid():N}",
            Code = "FAC-01",
            FacilityType = "Clinic",
            Province = "Gauteng",
            District = "Johannesburg",
            Address = "1 Main Road",
            IsActive = true,
        });

        created.Id.ShouldBeGreaterThan(0);

        var updated = await _facilityAppService.UpdateAsync(new UpdateFacilityDto
        {
            Id = created.Id,
            Name = created.Name,
            Code = "FAC-02",
            FacilityType = "RegionalHospital",
            Province = "Western Cape",
            District = "Cape Town",
            Address = "2 Main Road",
            IsActive = true,
        });

        updated.Code.ShouldBe("FAC-02");
        updated.FacilityType.ShouldBe("RegionalHospital");
        updated.Province.ShouldBe("Western Cape");
    }

    [Fact]
    public async Task AssignClinician_Should_Set_ClinicianFacilityId()
    {
        var facility = await _facilityAppService.CreateAsync(new CreateUpdateFacilityDto
        {
            Name = $"Assign-{Guid.NewGuid():N}",
            FacilityType = "Clinic",
            Province = "Gauteng",
            IsActive = true,
        });

        var clinicianEmail = $"assign-clinician-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Assign",
            LastName = "Clinician",
            EmailAddress = clinicianEmail,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = "HPCSA-0101",
            RequestedFacilityId = facility.Id,
        });

        var clinicianUserId = await UsingDbContextAsync(async context =>
            await context.Users.Where(item => item.EmailAddress == clinicianEmail).Select(item => item.Id).FirstAsync());

        await _facilityAppService.AssignClinician(new AssignClinicianFacilityInput
        {
            ClinicianUserId = clinicianUserId,
            FacilityId = facility.Id,
        });

        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstAsync(item => item.Id == clinicianUserId);
            user.ClinicianFacilityId.ShouldBe(facility.Id);
            user.RequestedFacility.ShouldBe(facility.Name);
        });
    }

    [Fact]
    public async Task SetActivation_Should_Update_Active_Status()
    {
        var facility = await _facilityAppService.CreateAsync(new CreateUpdateFacilityDto
        {
            Name = $"Activation-{Guid.NewGuid():N}",
            FacilityType = "Clinic",
            Province = "Gauteng",
            IsActive = true,
        });

        await _facilityAppService.SetActivation(new SetFacilityActivationInput
        {
            Id = facility.Id,
            IsActive = false,
        });

        var refreshed = await _facilityAppService.GetAsync(new EntityDto<int>(facility.Id));
        refreshed.IsActive.ShouldBeFalse();
    }

    [Fact]
    public async Task Create_Should_Reject_Unsupported_Province()
    {
        await Should.ThrowAsync<AbpValidationException>(async () =>
            await _facilityAppService.CreateAsync(new CreateUpdateFacilityDto
            {
                Name = $"Invalid-{Guid.NewGuid():N}",
                FacilityType = "Clinic",
                Province = "InvalidProvince",
                IsActive = true,
            }));
    }
}
